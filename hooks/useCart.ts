import { create } from "zustand";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";

interface CartItem {
  id?: string; // ID del registro en carrito (no el del producto)
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen_principal: string;
  descripcion: string;
}

interface CartState {
  cart: CartItem[];
  userId: string | null;
  total: number;
  setUserId: (id: string) => void;
  addItem: (item: Omit<CartItem, "id">) => Promise<void>;
  removeItem: (productoId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  checkoutEfectivo: () => Promise<void>;
}

export const useCart = create<CartState>((set, get) => ({
  cart: [],
  userId: null,
  total: 0,

  setUserId: (id) => set({ userId: id }),

  addItem: async (item) => {
    const { userId, cart } = get();
    if (!userId) {
      toast.error("Usuario no autenticado");
      return;
    }

    const existing = cart.find((i) => i.producto_id === item.producto_id);

    if (existing) {
      const { error } = await supabase
        .from("carritos")
        .update({ cantidad: existing.cantidad + item.cantidad })
        .eq("id", existing.id);

      if (error) {
        console.error("Error actualizando cantidad:", error);
        toast.error("Error actualizando carrito");
        return;
      }
    } else {
      const { error, data } = await supabase
        .from("carritos")
        .insert([
          {
            user_id: userId,
            producto_id: item.producto_id,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad,
            imagen_principal: item.imagen_principal,
            descripcion: item.descripcion,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error agregando al carrito:", error);
        toast.error("Error agregando producto");
        return;
      }
    }

    await get().loadCart();
  },

  removeItem: async (productoId) => {
    const { cart } = get();
    const item = cart.find((i) => i.producto_id === productoId);
    if (!item) return;

    const { error } = await supabase
      .from("carritos")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error("Error eliminando item:", error);
      toast.error("Error eliminando producto");
      return;
    }

    await get().loadCart();
  },

  clearCart: async () => {
    const { userId } = get();
    if (!userId) return;

    const { error } = await supabase
      .from("carritos")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error limpiando carrito:", error);
      toast.error("Error limpiando carrito");
      return;
    }

    set({ cart: [], total: 0 });
  },

  loadCart: async () => {
    const { userId } = get();
    if (!userId) return;

    const { data, error } = await supabase
      .from("carritos")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error cargando carrito:", error);
      toast.error("Error cargando carrito");
      return;
    }

    const total = data?.reduce(
      (sum: number, i: CartItem) => sum + i.precio * i.cantidad,
      0
    );

    set({ cart: data || [], total: total || 0 });
  },

  checkoutEfectivo: async () => {
    const { cart } = get();

    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    for (const item of cart) {
      const { data, error } = await supabase
        .from("productos")
        .select("existencias")
        .eq("id", item.producto_id)
        .single();

      if (error) {
        console.error("Error verificando inventario:", error);
        throw new Error(`Error verificando inventario para ${item.nombre}`);
      }

      if (!data || data.existencias < item.cantidad) {
        throw new Error(`No hay suficiente inventario para ${item.nombre}`);
      }
    }
    await get().clearCart();
    toast.success("Compra realizada con éxito");
  },
}));
