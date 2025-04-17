"use client";

import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from '@/lib/supabase-browser';
import type { CartItem } from "@/hooks/useCart"; // importante si no está ya

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
        const items: CartItem[] = data.map((item) => ({
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
