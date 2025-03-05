"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

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

  useEffect(() => {
    const fetchUser = async (session: Session | null) => {
      if (!session?.user) {
        setUser(null);
        return;
      }

      // 🔹 Consultamos la información adicional del usuario desde Supabase
      const { data, error } = await supabase
        .from("profiles")
        .select("nombre, apellido, avatar")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error obteniendo perfil:", error);
        setUser(session.user as User & Users);
      } else {
        setUser({ ...session.user, ...data });
      }
    };

    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await fetchUser(data.session);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchUser(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
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