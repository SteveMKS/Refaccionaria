"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

type CartItemProps = {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  };
};

export const CartItem = ({ item }: CartItemProps) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex justify-between items-center border-b pb-2">
      <div>
        <h3 className="font-medium">{item.name}</h3>
        <p>${item.price} MXN x {item.quantity}</p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
        >
          -
        </Button>
        <span className="px-2">{item.quantity}</span>
        <Button
          size="sm"
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
        >
          +
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => removeFromCart(item.id)}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
};