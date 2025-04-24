'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase-browser';
import { numeroALetras } from '@/hooks/numeroALetras';
import jsPDF from "jspdf";
import type { User } from '@supabase/supabase-js';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imagen_principal: string;
  descripcion: string;
};

type CartStore = {
  cart: CartItem[];
  total: number;
  user: User | null;
  initUser: () => void;
  setUser: (user: User | null) => void;
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearCartState: () => void;
  setCartFromDB: (items: CartItem[]) => void;
  checkoutEfectivo: () => Promise<void | { error: string }>;
};

export const useCart = create<CartStore>((set, get) => ({
  cart: [],
  total: 0,
  user: null,

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
    let newTotal = total + product.price;

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
        cantidad: 1,
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
    const { cart, total, user, clearCart } = get();
    if (!user || cart.length === 0) return;
  
    const now = new Date();
    const fecha = now.toISOString().split("T")[0]; // Formato: YYYY-MM-DD
    const hora = now.toTimeString().split(" ")[0]; // Formato: HH:MM:SS
    const status = "Pagado"; // O puedes manejar "Pendiente" si es el caso
  
    // Guarda la orden en la base de datos
    const { data: order, error } = await supabase
      .from("recibos")
      .insert({
        id_user: user.id,
        status,
        fecha,
        hora,
        total,
        metodo_pago: "Efectivo",
        productos: cart, // Asegúrate que el campo `productos` en tu tabla sea de tipo `json`
      })
      .select()
      .single();
  
    if (error) {
      console.error("Error al guardar la orden:", error);
      return;
    }
  
    // Generar recibo como string
    const productosTxt = cart.map(item =>
      `- ${item.name} x${item.quantity} @ $${item.price} = $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
  
    const totalLetra = numeroALetras(total);
  
    const recibo = `
  RECIBO DE COMPRA
  
  Fecha: ${fecha}
  Hora: ${hora}
  Cliente: ${user.email}
  
  Productos:
  ${productosTxt}
  
  TOTAL: $${total.toFixed(2)} (${totalLetra})
  
  Gracias por su compra.
    `;
  
    // Crear PDF y descargarlo
    const doc = new jsPDF();
    const lineas = recibo.trim().split("\n");
  
    lineas.forEach((linea, i) => {
      doc.text(linea.trim(), 10, 10 + i * 8); // Posición inicial + espaciado
    });
  
    const fileName = `recibo_${fecha.replace(/-/g, "")}_${hora.replace(/:/g, "")}.pdf`;
    doc.save(fileName);
  
    clearCart(); // Limpia el carrito
  }
  
}));

/*import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imagen_principal: string;
  descripcion: string;
};

type CartStore = {
  cart: CartItem[];
  total: number;
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearCartState: () => void; // NUEVO
  setCartFromDB: (items: CartItem[]) => void;
};

export const useCart = create<CartStore>((set, get) => ({
  cart: [],
  total: 0,

  // ✅ Limpia solo el estado local (sin tocar supabase)
  clearCartState: () => set({ cart: [], total: 0 }),

  // ✅ Establece el carrito desde Supabase al iniciar sesión
  setCartFromDB: (items) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    set({ cart: items, total });
  },

  // ✅ Agregar al carrito y guardar en Supabase
  addToCart: async (product) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { cart, total } = get();
    const existingItem = cart.find((item) => item.id === product.id);

    let updatedCart: CartItem[];
    let newTotal = total + product.price;

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
        cantidad: 1,
      });
    }

    set({ cart: updatedCart, total: newTotal });
  },

  // ✅ Eliminar producto del carrito
  removeFromCart: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
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

  // ✅ Cambiar cantidad
  updateQuantity: async (id, quantity) => {
    const { data: { user } } = await supabase.auth.getUser();
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

  // ✅ Vaciar carrito
  clearCart: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("carritos")
      .delete()
      .eq("user_id", user.id);

    set({ cart: [], total: 0 });
  },
}));*/
