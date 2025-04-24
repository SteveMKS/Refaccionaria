"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "./CartItem";
import { toast } from "sonner";

export const Cart = () => {
  const { cart, total, clearCart, checkoutEfectivo } = useCart();

  const handleCheckout = async () => {
    try {
      await checkoutEfectivo();
      toast.success("Compra realizada con éxito");
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar la compra");
    }
  };

  return (
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
                  onClick={clearCart}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Vaciar Carrito
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Pagar en efectivo
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
