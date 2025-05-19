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
  checkoutTarjeta: () => Promise<{ url?: string; error?: string }>;
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
      // 1. Verificamos inventario primero
      for (const item of cart) {
        const { data: producto, error } = await supabase
          .from("productos")
          .select("existencias, nombre")
          .eq("id_sku", item.id)
          .single();

        if (error || !producto) {
          set({ isCheckoutInProgress: false }); // Importante restablecer el estado
          return { error: `Error consultando el inventario de ${item.name}` };
        }

        if (producto.existencias < item.quantity) {
          set({ isCheckoutInProgress: false }); // Importante restablecer el estado
          return { error: `No hay suficiente stock de "${producto.nombre}". Disponible: ${producto.existencias}, solicitado: ${item.quantity}` };
        }
      }

      // 2. Descontamos existencias solo si pasamos la verificación
      for (const item of cart) {
        const { error } = await supabase.rpc("descontar_existencias", {
          sku: item.id,
          cantidad: item.quantity
        });

        if (error) {
          set({ isCheckoutInProgress: false }); // Importante restablecer el estado
          return { error: `Error al descontar inventario de "${item.name}"` };
        }
      }

      // 3. Registramos la venta
      const ticketId = uuidv4();
      const now = new Date();
      const fecha = now.toISOString().split("T")[0];
      const hora = now.toTimeString().split(" ")[0];
      const metodoPago = "Efectivo";

      const { error: insertError } = await supabase
        .from("recibos")
        .insert({
          id_user: user.id,
          status: "Pagado",
          fecha,
          hora,
          total,
          metodo_pago: metodoPago,
          productos: cart,
          ticket_id: ticketId
        });

      if (insertError) {
        set({ isCheckoutInProgress: false }); // Importante restablecer el estado
        return { error: "Error al guardar el recibo" };
      }

      await get().clearCart();

      return {
        fecha,
        hora,
        cliente: user.email || user.user_metadata?.name || "Cliente",
        ticketId,
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
  
checkoutTarjeta: async (): Promise<{ url?: string; error?: string }> => {
  const { cart, total, user, isCheckoutInProgress } = get();

  if (isCheckoutInProgress) {
    return { error: "Procesando compra, por favor espera" };
  }

  if (!user || cart.length === 0) {
    return { error: "Carrito vacío o usuario no autenticado" };
  }

  set({ isCheckoutInProgress: true });

  try {
    // Validar inventario
    for (const item of cart) {
      const { data: producto, error } = await supabase
        .from("productos")
        .select("existencias, nombre")
        .eq("id_sku", item.id)
        .single();

      if (error || !producto) {
        return { error: `Error consultando inventario de ${item.name}` };
      }

      if (producto.existencias < item.quantity) {
        return {
          error: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.existencias}, solicitado: ${item.quantity}`,
        };
      }
    }

    // Crear recibo en estado "pendiente"
    const ticketId = uuidv4();
    const now = new Date();
    const fecha = now.toISOString().split("T")[0];
    const hora = now.toTimeString().split(" ")[0];
    const metodoPago = "Tarjeta";

    const { error: insertError } = await supabase.from("recibos").insert({
      id_user: user.id,
      status: "pendiente",
      fecha,
      hora,
      total,
      metodo_pago: metodoPago,
      productos: cart,
      ticket_id: ticketId,
      stripe_session: null,
    });

    if (insertError) {
      return { error: "Error al guardar el recibo inicial" };
    }

    // Crear sesión de Stripe con ticket_id en metadata
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        userId: user.id,
        productos: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        ticket_id: ticketId,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.url || !data.sessionId) {
      await supabase
        .from("recibos")
        .update({ status: "fallido" })
        .eq("ticket_id", ticketId);
      return { error: data.error || "No se pudo iniciar el pago con Stripe" };
    }

    // Actualizar recibo con sessionId de Stripe
    await supabase
      .from("recibos")
      .update({ stripe_session: data.sessionId })
      .eq("ticket_id", ticketId);

    return { url: data.url };
  } catch (error) {
    console.error("Error en checkoutTarjeta:", error);
    return { error: "Error inesperado al procesar el pago" };
  } finally {
    set({ isCheckoutInProgress: false });
  }
},
}));