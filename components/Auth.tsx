"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { useCart } from "@/hooks/useCart";

interface Users {
  nombre: string;
  apellido: string;
  avatar: string;
}

interface AuthContextType {
  user: (User & Users) | null;
  session: Session | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<(User & Users) | null>(null);
  const setCartFromDB = useCart((state) => state.setCartFromDB);
  const clearCart = useCart((state) => state.clearCart);

  const fetchUserAndCart = async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      clearCart(); // Limpia el carrito si no hay sesión
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("nombre, apellido, avatar")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.error("Error obteniendo perfil:", profileError);
      setUser(session.user as User & Users);
    } else {
      setUser({ ...session.user, ...profile });
    }

    const { data: carritoDB, error: carritoError } = await supabase
      .from("carritos")
      .select("producto_id, nombre, precio, cantidad, imagen_principal, descripcion")
      .eq("user_id", session.user.id);

    if (!carritoError && carritoDB) {
      setCartFromDB(
        carritoDB.map((item) => ({
          id: item.producto_id,
          name: item.nombre,
          price: item.precio,
          quantity: item.cantidad,
          imagen_principal: item.imagen_principal,
          descripcion: item.descripcion,
        }))
      );
    } else {
      clearCart(); // Asegura que no se mantenga el carrito si no hay datos válidos
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await fetchUserAndCart(data.session);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchUserAndCart(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    clearCart(); // 🧼 Limpia el carrito directamente
  };

  return (
    <AuthContext.Provider value={{ user, session, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
