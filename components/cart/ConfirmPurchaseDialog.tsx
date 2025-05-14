"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/useCart";
import { toast } from "sonner";
import { useState } from "react";

export function ConfirmPurchaseDialog() {
  const checkoutEfectivo = useCart((state) => state.checkoutEfectivo);
  const [loading, setLoading] = useState(false);

  const handleConfirmPurchase = async () => {
    try {
      setLoading(true);
      await checkoutEfectivo();
      toast.success("Compra realizada con éxito");
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la compra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full" disabled={loading}>
          {loading ? "Procesando..." : "Realizar Compra"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar compra?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se generará un ticket y se vaciará su carrito después de la compra.
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
