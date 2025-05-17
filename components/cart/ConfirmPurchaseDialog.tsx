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
import { toast } from "sonner";
import { useState, ReactNode } from "react";
import { Loader2 } from "lucide-react";

// Define las props directamente aquí (puedes moverlo a otro archivo si lo deseas)
interface ConfirmPurchaseDialogProps {
  onConfirm: () => Promise<any>;
  trigger?: ReactNode;
  children?: ReactNode;
}

export function ConfirmPurchaseDialog({
  onConfirm,
  trigger,
  children,
}: ConfirmPurchaseDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirmPurchase = async () => {
    try {
      setLoading(true);

      const result = await onConfirm();

      // Verificación explícita: si es un objeto y tiene una propiedad 'error'
      if (result && typeof result === 'object' && 'error' in result) {
        toast.error(result.error);
        return; // Importante: terminar la función aquí para evitar mostrar mensaje de éxito
      }

      // Solo llega aquí si no hay errores
      toast.success("Compra realizada con éxito");
    } catch (error: any) {
      console.error("Error en confirmPurchase:", error);
      toast.error(error.message || "Error al procesar la compra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Procesando..." : "Realizar Compra"}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar compra?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se generará un ticket y se vaciará
            su carrito después de la compra.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmPurchase} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Comprando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}