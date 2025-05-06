"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "./CartItem";
import { TicketModal } from "@/components/Tickets";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/components/Auth";
import { ConfirmPurchaseDialog } from "@/components/ui/AlertConfirmBuy";

type CheckoutResult = {
  fecha: string;
  hora: string;
  cliente: string;
  ticketId: string;
  productos: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imagen_principal?: string;
    descripcion?: string;
  }[];
  total: number;
  metodoPago: string;
} | { 
  error: string 
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
      // Verificación del ticketId antes de mostrarlo
      console.log("Ticket ID generado:", result.ticketId);
      setTicketData(result);
      setShowTicket(true);
      toast.success("Compra realizada con éxito");
    }
  };

  const handleStripeCheckout = async () => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartItems: cart.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error en la creación de la sesión de pago");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error("Error al procesar el pago con tarjeta");
    }
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">
            Carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Tu Carrito</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            {cart.length === 0 ? (
              <p>El carrito está vacío</p>
            ) : (
              <>
                {cart.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
                <div className="border-t pt-4 space-y-2">
                  <p className="font-bold">Total: ${total.toFixed(2)} MXN</p>
                  <Button
                    onClick={handleStripeCheckout}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Pagar con tarjeta
                  </Button>
                  
                  {isEmployee && (
                    <ConfirmPurchaseDialog onConfirm={handleCheckout} />
                  )} 

                  <Button
                    onClick={clearCart}
                    variant="destructive"
                    className="w-full"
                  >
                    Vaciar Carrito
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

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