"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/useCart";
import { CartItem } from "./CartItem";
import { TicketModal } from "@/components/cart/Tickets";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider/Auth";
import { ConfirmPurchaseDialog } from "@/components/cart/AlertConfirmBuy";
import {
  ShoppingCart,
  CreditCard,
  CheckCircle,
  Trash2,
} from "lucide-react";

type Producto = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imagen_principal?: string;
  descripcion?: string;
};

type CheckoutResult =
  | {
      fecha: string;
      hora: string;
      cliente: string;
      ticketId: string;
      productos: Producto[];
      total: number;
      metodoPago: string;
    }
  | {
      error: string;
    };


export const Cart = () => {
  const { user, isEmployee } = useAuth();
  const { cart, total, clearCart, checkoutEfectivo } = useCart();
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<CheckoutResult | null>(null);

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para realizar una compra");
      return;
    }

    const result = await checkoutEfectivo();

    if ("error" in result) {
      toast.error(result.error);
    } else {
      setTicketData(result);
      setShowTicket(true);
      toast.success("Compra realizada con éxito");
    }
  };

// Corrección del método handleStripeCheckout en Cart.tsx
const handleStripeCheckout = async () => {
  if (!user) {
    toast.error("Debes iniciar sesión para pagar con tarjeta");
    return;
  }

  const res = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      productos: cart.map((item) => ({
        nombre: item.name,     // asegúrate que `name` sea el nombre del producto
        precio: item.price,    // asegúrate que `price` esté en MXN (ej. 129.99)
        cantidad: item.quantity,
      })),
    }),
  });

  const data = await res.json();

  if (data.url) {
    window.location.href = data.url; // Redirige a Stripe Checkout
  } else {
    toast.error(data.error || "Error al redirigir al pago");
  }
};


  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Carrito
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          {/* ENCABEZADO */}
          <SheetHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <SheetTitle className="text-lg font-semibold">Tu Carrito</SheetTitle>
              </div>
            </div>
          </SheetHeader>

          {/* PRODUCTOS */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mb-4 opacity-50" />
                <p className="font-medium">Tu carrito está vacío</p>
                <p className="text-sm mt-1">Agrega productos para comenzar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* ACCIONES DE COMPRA */}
          {cart.length > 0 && (
            <div className="border-t px-4 py-4 space-y-3 bg-muted/50">
              <div className="flex justify-between items-center font-medium">
                <span>Total:</span>
                <span className="text-lg">${total.toFixed(2)} MXN</span>
              </div>

              <div className="space-y-2">
                {/* Pagar con tarjeta */}
                <Button
                  onClick={handleStripeCheckout}
                  className="w-full h-11 bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagar con tarjeta
                </Button>

                {/* Pago en efectivo solo para empleados */}
                {isEmployee && (
                  <ConfirmPurchaseDialog
                    onConfirm={handleCheckout}
                    trigger={
                      <Button
                        className="w-full h-11 bg-primary hover:bg-primary/90"
                        size="lg"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Pago en Efectivo
                      </Button>
                    }
                  />
                )}

                {/* Vaciar carrito */}
                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="w-full h-11 border-destructive text-destructive hover:bg-destructive/10"
                  size="lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Vaciar Carrito
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de ticket al finalizar compra */}
      {ticketData && !("error" in ticketData) && (
        <TicketModal
          open={showTicket}
          onClose={() => {
            setShowTicket(false);
            clearCart();
          }}
          productos={ticketData.productos}
          total={ticketData.total}
          fecha={ticketData.fecha}
          hora={ticketData.hora}
          cliente={ticketData.cliente}
          ticketId={ticketData.ticketId}
          metodoPago={ticketData.metodoPago}
        />
      )}
    </>
  );
};
