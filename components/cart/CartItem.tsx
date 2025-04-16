"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

type CartItemProps = {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imagen_principal: string;
    descripcion: string;
  };
};

export const CartItem = ({ item }: CartItemProps) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-start gap-4 border-b pb-4">
      {/* Imagen del producto */}
      <div className="w-20 h-20 relative">
        <Image
          src={item.imagen_principal}
          alt={item.name}
          fill
          className="object-cover rounded"
        />
      </div>

      {/* Detalles del producto */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold">{item.name}</h3>
        <p className="text-xs text-muted-foreground">{item.descripcion}</p>
        <p className="text-sm font-medium">
          ${item.price} MXN x {item.quantity}
        </p>

        {/* Controles de cantidad */}
        <div className="flex gap-2 mt-2 items-center">
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
    </div>
  );
};
