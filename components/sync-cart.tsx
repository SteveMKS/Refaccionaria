"use client";

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
        }));
        setCartFromDB(items);
      }
    };

    cargarCarrito();
  }, [setCartFromDB]);

  return null;
};
