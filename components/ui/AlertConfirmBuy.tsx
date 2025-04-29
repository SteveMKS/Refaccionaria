"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ConfirmPurchaseDialogProps {
  onConfirm: () => Promise<void>; // Va a recibir una función async para confirmar la compra
}

export function ConfirmPurchaseDialog({ onConfirm }: ConfirmPurchaseDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirmPurchase = async () => {
    try {
      setLoading(true);
      await onConfirm(); // Aquí ejecutamos la función que nos pasen (handleCheckout)
    } catch (error) {
      console.error("Error al confirmar compra:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
          {loading ? "Procesando..." : "Pagar en efectivo"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar compra?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción generará un ticket y vaciará tu carrito.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmPurchase} disabled={loading}>
            {loading ? "Comprando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
