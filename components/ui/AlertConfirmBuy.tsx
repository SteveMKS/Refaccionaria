"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRoleUser } from "@/hooks/useRoleUsers";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ConfirmPurchaseDialogProps {
  onConfirm: () => Promise<void>; // Función que se pasa para realizar la compra
}

export function ConfirmPurchaseDialog({ onConfirm }: ConfirmPurchaseDialogProps) {
  const [loading, setLoading] = useState(false);
  const { roleUser, loading: roleLoading } = useRoleUser(); // Verificamos el rol del usuario

  const handleConfirmPurchase = async () => {
    try {
      setLoading(true);
      await onConfirm(); // Ejecutamos la función externa que maneja la compra
      toast.success("Compra realizada con éxito");
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la compra");
    } finally {
      setLoading(false);
    }
  };

  // Esperamos a que se cargue la información del rol
  if (roleLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  // Verificamos que el usuario tenga el rol adecuado para realizar la compra
  if (roleUser !== "admin" && roleUser !== "empleado") return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
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
