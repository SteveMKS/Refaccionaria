'use client';

import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabase-browser';
import { Session, User } from '@supabase/supabase-js';
import { useCart } from '@/hooks/useCart';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

interface Users {
  nombre: string;
  apellido: string;
  correo: string;  
  avatar?: string;
  rol?: 'user' | 'empleado' | 'admin'; // Nuevo campo rol
}

interface CarritoItemFromDB {
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen_principal: string;
  descripcion: string;
}

interface AuthContextType {
  user: UserWithProfile | null;
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAdmin: boolean; // Nuevas propiedades
  isEmployee: boolean;
  userRole: string | null;
}

type UserWithProfile = User & Users;
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchUser = async (session: Session | null) => {
    const { setCartFromDB } = useCart.getState();
  
    if (!session?.user) {
      setUser(null);
      setUserRole(null);
      return;
    }
  
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('nombre, apellido, correo, avatar, rol') // Incluir rol en la consulta
      .eq('id', session.user.id)
      .single();
  
    if (profileError) {
      console.error('Error obteniendo perfil:', profileError);
      setUser(session.user as UserWithProfile);
      setUserRole('user'); // Valor por defecto
    } else {
      const userWithProfile = { 
        ...session.user, 
        ...profile,
        rol: profile.rol || 'user' // Valor por defecto si no tiene rol
      };
      setUser(userWithProfile);
      setUserRole(userWithProfile.rol);
    }
  
    // Cargar productos del carrito (mantenemos esta lógica)
    const { data: carritoDB, error: carritoError } = await supabase
      .from('carritos')
      .select('producto_id, nombre, precio, cantidad, imagen_principal, descripcion')
      .eq('user_id', session.user.id);
  
    if (carritoError) {
      console.error('Error cargando carrito:', carritoError);
    } else if (carritoDB) {
      setCartFromDB(
        carritoDB.map((item: CarritoItemFromDB) => ({
          id: item.producto_id,
          name: item.nombre,
          price: item.precio,
          quantity: item.cantidad,
          imagen_principal: item.imagen_principal,
          descripcion: item.descripcion,
        }))
      );
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await fetchUser(data.session);
      setLoading(false);
    };
  
    initAuth();
  
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setSession(session);
        fetchUser(session);
      }
    );
  
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserRole(null);
    useCart.getState().clearCart();
  };

  const value = {
    user,
    session,
    loading,
    logout,
    isAdmin: userRole === 'admin',
    isEmployee: userRole === 'empleado' || userRole === 'admin',
    userRole
  };

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </SessionContextProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}