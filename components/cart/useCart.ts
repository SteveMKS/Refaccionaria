'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase-browser';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@supabase/supabase-js';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imagen_principal: string;
  descripcion: string;
};

type CheckoutResult = {
  fecha: string;
  hora: string;
  cliente: string;
  ticketId: string;
  productos: CartItem[];
  total: number;
  metodoPago: string;
} | { 
  error: string 
};

type CartStore = {
  cart: CartItem[];
  total: number;
  user: User | null;
  isCheckoutInProgress: boolean;
  initUser: () => void;
  setUser: (user: User | null) => void;
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearCartState: () => void;
  setCartFromDB: (items: CartItem[]) => void;
  checkoutEfectivo: () => Promise<CheckoutResult>;
};

export const useCart = create<CartStore>((set, get) => ({
  cart: [],
  total: 0,
  user: null,
  isCheckoutInProgress: false,

  initUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    set({ user });
  },

  setUser: (user) => set({ user }),

  clearCartState: () => set({ cart: [], total: 0 }),

  setCartFromDB: (items) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    set({ cart: items, total });
  },

  addToCart: async (product) => {
    const user = get().user;
    if (!user) return;

    const { cart, total } = get();
    const existingItem = cart.find((item) => item.id === product.id);

    let updatedCart: CartItem[];
    const newTotal = total + product.price;

    if (existingItem) {
      updatedCart = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );

      await supabase
        .from("carritos")
        .update({ cantidad: existingItem.quantity + 1 })
        .eq("user_id", user.id)
        .eq("producto_id", product.id);
    } else {
      updatedCart = [...cart, { ...product, quantity: 1 }];

      await supabase.from("carritos").insert({
        user_id: user.id,
        producto_id: product.id,
        nombre: product.name,
        precio: product.price,
        imagen_principal: product.imagen_principal,
        descripcion: product.descripcion,
        cantidad: 1
      });
    }

    set({ cart: updatedCart, total: newTotal });
  },

  removeFromCart: async (id) => {
    const user = get().user;
    if (!user) return;

    const { cart } = get();
    const itemToRemove = cart.find((item) => item.id === id);
    if (!itemToRemove) return;

    const updatedCart = cart.filter((item) => item.id !== id);
    const newTotal = get().total - itemToRemove.price * itemToRemove.quantity;

    await supabase
      .from("carritos")
      .delete()
      .eq("user_id", user.id)
      .eq("producto_id", id);

    set({ cart: updatedCart, total: newTotal });
  },

  updateQuantity: async (id, quantity) => {
    const user = get().user;
    if (!user) return;

    const { cart } = get();
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    const updatedCart = cart.map((i) =>
      i.id === id ? { ...i, quantity } : i
    );
    const newTotal = updatedCart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    await supabase
      .from("carritos")
      .update({ cantidad: quantity })
      .eq("user_id", user.id)
      .eq("producto_id", id);

    set({ cart: updatedCart, total: newTotal });
  },

  clearCart: async () => {
    const user = get().user;
    if (!user) return;

    await supabase
      .from("carritos")
      .delete()
      .eq("user_id", user.id);

    set({ cart: [], total: 0 });
  },

  checkoutEfectivo: async () => {
    const { cart, total, user, isCheckoutInProgress } = get();
    
    if (isCheckoutInProgress) {
      return { error: "Procesando compra, por favor espera" };
    }
    
    if (!user || cart.length === 0) {
      return { error: "Carrito vacío o usuario no autenticado" };
    }
    
    set({ isCheckoutInProgress: true });
    
    try {
      // Generación única del UUID
      const ticketId = uuidv4();
      const now = new Date();
      const fecha = now.toISOString().split("T")[0];
      const hora = now.toTimeString().split(" ")[0];
      const metodoPago = "Efectivo";
  
      // Guardar en Supabase con el ticketId generado
      const { error } = await supabase
        .from("recibos")
        .insert({
          id_user: user.id,
          status: "Pagado",
          fecha,
          hora,
          total,
          metodo_pago: metodoPago,
          productos: cart,
          ticket_id: ticketId, // Usamos el mismo UUID generado
        });
  
      if (error) {
        console.error("Error al guardar la orden:", error);
        return { error: "Error al guardar el recibo" };
      }
  
      await get().clearCart();
  
      return {
        fecha,
        hora,
        cliente: user.email || user.user_metadata?.name || "Cliente",
        ticketId, // Devolvemos el mismo UUID
        productos: [...cart],
        total,
        metodoPago
      };
    } catch (error) {
      console.error("Error en checkoutEfectivo:", error);
      return { error: "Error inesperado al procesar el pago" };
    } finally {
      set({ isCheckoutInProgress: false });
    }
  },
}));
