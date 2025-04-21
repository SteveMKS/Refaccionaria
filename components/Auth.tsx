'use client';

import {
  SessionContextProvider,
} from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabase-browser';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useCart } from '@/hooks/useCart';

interface Users {
  nombre: string;
  apellido: string;
  correo: string;  
  avatar?: string;
}

interface AuthContextType {
  user: UserWithProfile | null;
  session: Session | null;
  logout: () => Promise<void>;
  loading: boolean;
}

type UserWithProfile = User & Users;
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (session: Session | null) => {
    const { setCartFromDB } = useCart.getState();

    if (!session?.user) {
      setUser(null);
      return;
    }

    const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('nombre, apellido, correo, avatar')
    .eq('id', session.user.id)
    .single();
  

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError);
      setUser(session.user as User & Users);
    } else {
      setUser({ ...session.user, ...profile });
    }

    const { data: carritoDB, error: carritoError } = await supabase
      .from('carritos')
      .select('producto_id, nombre, precio, cantidad, imagen_principal, descripcion')
      .eq('user_id', session.user.id)
      .eq('id', session.user.id);


    if (!carritoError && carritoDB) {
      setCartFromDB(
        carritoDB.map((item: any) => ({
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
    useCart.getState().clearCart();
  };

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthContext.Provider value={{ user, session, logout, loading }}>
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


/*"use client";

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

  const fetchUser = async (session: Session | null) => {
    const { setCartFromDB } = useCart.getState();

    if (!session?.user) {
      setUser(null);
      return;
    }

    // 🔹 Consultamos la información adicional del usuario desde Supabase
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

    // 🔸 Obtenemos el carrito del usuario
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
    }
  };

  useEffect(() => {
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
    useCart.getState().clearCart(); // 🧹 Vacía el carrito en memoria al cerrar sesión
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
}*/
