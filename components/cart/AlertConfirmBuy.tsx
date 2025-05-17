"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRoleUser } from "@/hooks/useRoleUsers";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface ConfirmPurchaseDialogProps {
  onConfirm: () => Promise<any>;
  trigger?: ReactNode; // Nueva prop opcional
  children?: ReactNode; // Mantenemos children para compatibilidad
}

export function ConfirmPurchaseDialog({ 
  onConfirm, 
  trigger,
  children 
}: ConfirmPurchaseDialogProps) {
  const [loading, setLoading] = useState(false);
  const { roleUser, loading: roleLoading } = useRoleUser();

  const handleConfirmPurchase = async () => {
    try {
      setLoading(true);
      const result = await onConfirm();
      
      // Verificamos si el resultado contiene un error
      if (result && typeof result === "object" && "error" in result) {
        toast.error(result.error);
        return;
      }
      
      // Solo mostramos el mensaje de éxito si no hubo errores
      toast.success("Compra realizada con éxito");
    } catch (error: any) {
      toast.error(error.message || "Error al procesar la compra");
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  if (roleUser !== "admin" && roleUser !== "empleado") return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || children || (
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
            {loading ? "Procesando..." : "Pagar en efectivo"}
          </Button>
        )}
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}