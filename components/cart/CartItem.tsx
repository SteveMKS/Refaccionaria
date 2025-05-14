"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/useCart";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useEffect } from "react";

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
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  // Sincronizar cantidad cuando cambia externamente
  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(100, value)); // Limitar entre 1 y 100
    setLocalQuantity(newQuantity);
    updateQuantity(item.id, newQuantity);
  };

  const handleRemove = () => {
    removeFromCart(item.id);
    toast.success("Producto eliminado del carrito");
  };

  return (
    <div className="flex items-start gap-4 border-b pb-4">
      <div className="w-20 h-20 relative flex-shrink-0">
        <Image
          src={item.imagen_principal || "/placeholder-product.jpg"}
          alt={item.name}
          fill
          className="object-cover rounded"
          sizes="80px"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-product.jpg";
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">{item.name}</h3>
            {item.descripcion && (
              <p className="text-xs text-muted-foreground truncate">
                {item.descripcion}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={handleRemove}
          >
            ×
          </Button>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm font-medium">
            ${item.price.toFixed(2)} MXN
          </p>
          <p className="text-sm font-semibold">
            ${(item.price * item.quantity).toFixed(2)} MXN
          </p>
        </div>

        <div className="flex gap-2 mt-3 items-center">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            -
          </Button>
          
          <Input
            type="number"
            min="1"
            max="100"
            value={localQuantity}
            onChange={(e) => handleQuantityChange(Number(e.target.value))}
            className="w-12 h-8 text-center"
          />
          
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleQuantityChange(item.quantity + 1)}
          >
            +
          </Button>
        </div>
      </div>
    </div>
  );
};