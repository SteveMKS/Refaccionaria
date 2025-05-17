'use client';

import { useCart } from "@/components/cart/useCart";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRoleUser } from '@/hooks/useRoleUsers';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function PagoEfectivoButton() {
  const checkoutEfectivo = useCart((state) => state.checkoutEfectivo);
  const { roleUser, loading } = useRoleUser();
  const [procesando, setProcesando] = useState(false);

  const handlePago = async () => {
    try {
      setProcesando(true);
      const result = await checkoutEfectivo();
      
      // Verificación de tipo segura
      if (result && 'error' in result) {
        toast.error(result.error);
        return;
      }

      // Si llegamos aquí, es el tipo con los datos del ticket
      toast.success("Pago registrado exitosamente. Recibo generado.");
      
    } catch (error) {
      console.error("Error en el pago:", error);
      toast.error("Error al procesar el pago en efectivo");
    } finally {
      setProcesando(false);
    }
  };

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  // Mostrar solo para admin o empleado
  if (roleUser !== 'admin' && roleUser !== 'empleado') {
    return null;
  }

  return (
    <Button 
      className="bg-green-600 hover:bg-green-700 text-white" 
      onClick={handlePago}
      disabled={procesando}
    >
      {procesando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {procesando ? "Procesando..." : "Pagar en efectivo"}
    </Button>
  );
}