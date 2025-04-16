"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "./CartItem";

export const Cart = () => {
  const { cart, total, clearCart } = useCart();

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
                <CartItem key={item.imagen_principal} item={item} />
                <CartItem key={item.id} item={item} />
                <CartItem key={item.descripcion} item={item} />
              ))}
              <div className="border-t pt-4">
                <p className="font-bold">Total: ${total.toFixed(2)} MXN</p>
                <Button
                  onClick={clearCart}
                  className="mt-2 w-full bg-red-600 hover:bg-red-700"
                >
                  Vaciar Carrito
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
