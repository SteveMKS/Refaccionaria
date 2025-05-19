'use client';

import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabase-browser';
import { Session, User } from '@supabase/supabase-js';
import { useCart } from '@/components/cart/useCart';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

interface Users {
  nombre?: string;
  apellido?: string;
  correo?: string;
  avatar?: string;
  rol?: 'user' | 'empleado' | 'admin';
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
  isAdmin: boolean;
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

    const userId = session.user.id;
    const userEmail = session.user.email;

    // 🔍 Verificar existencia en tabla public.users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('nombre, apellido, correo, avatar, rol')
      .eq('id', userId)
      .single();

    // Si no existe, lo insertamos automáticamente
    if (profileError && profileError.code === 'PGRST116') {
      console.warn('🧩 Usuario no encontrado en tabla "users", creando entrada...');

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          correo: userEmail,
          nombre: session.user.user_metadata?.name || 'Cliente',
          apellido: '',
          avatar: session.user.user_metadata?.avatar_url || null,
          rol: 'user',
        });

      if (insertError) {
        console.error('❌ Error al insertar usuario en "users":', insertError.message);
      }
    }

    // 🔁 Obtener el perfil actualizado
    const { data: profileFinal } = await supabase
      .from('users')
      .select('nombre, apellido, correo, avatar, rol')
      .eq('id', userId)
      .single();

    const userWithProfile: UserWithProfile = {
      ...session.user,
      ...profileFinal,
      rol: profileFinal?.rol || 'user',
    };

    setUser(userWithProfile);
    setUserRole(userWithProfile.rol ?? 'user'); // 🔒 Siempre asegura string válido

    // 🛒 Sincronizar carrito del usuario
    const { data: carritoDB, error: carritoError } = await supabase
      .from('carritos')
      .select('producto_id, nombre, precio, cantidad, imagen_principal, descripcion')
      .eq('user_id', userId);

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

  const value: AuthContextType = {
    user,
    session,
    loading,
    logout,
    isAdmin: userRole === 'admin',
    isEmployee: userRole === 'empleado' || userRole === 'admin',
    userRole,
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
