'use client';

import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from '@/lib/supabase-browser';

export const SyncCart = () => {
  const setCartFromDB = useCart((state) => state.setCartFromDB);

  // Definir los tipos directamente dentro de este archivo
  type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imagen_principal: string;
    descripcion: string;
  };

  type CarritoDB = {
    producto_id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    imagen_principal: string;
    descripcion: string;
  };

  useEffect(() => {
    const cargarCarrito = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("carritos")
        .select("*")
        .eq("user_id", user.id);

      if (data) {
        const items: CartItem[] = (data as CarritoDB[]).map((item) => ({
          id: item.producto_id,
          name: item.nombre,
          price: item.precio,
          quantity: item.cantidad,
          imagen_principal: item.imagen_principal,
          descripcion: item.descripcion
        }));
        setCartFromDB(items);
      }
    };

    cargarCarrito();
  }, [setCartFromDB]);

  return null;
};


/*"use client";

import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";

export const SyncCart = () => {
  const setCartFromDB = useCart((state) => state.setCartFromDB);

  useEffect(() => {
    const cargarCarrito = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("carritos")
        .select("*")
        .eq("user_id", user.id);

      if (data) {
        const items = data.map((item) => ({
          id: item.producto_id,
          name: item.nombre,
          price: item.precio,
          quantity: item.cantidad,
          imagen_principal: item.imagen_principal,
          descripcion: item.descripcion
        }));
        setCartFromDB(items);
      }
    };

    cargarCarrito();
  }, [setCartFromDB]);

  return null;
};*/
