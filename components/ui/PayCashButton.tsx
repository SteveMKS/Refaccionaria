'use client';

import { useCart } from "@/hooks/useCart";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRoleUser } from '@/hooks/useRoleUsers'; // <- Import corregido
import { Loader2 } from 'lucide-react';

export default function PagoEfectivoButton() {
  const checkoutEfectivo = useCart((state) => state.checkoutEfectivo);
  const { roleUser, loading } = useRoleUser(); // <- Uso correcto del hook

  const handlePago = async () => {
    const result = await checkoutEfectivo();
    if (result?.error) {
      toast.error("Hubo un error al realizar el pago.");
    } else {
      toast.success("Pago registrado exitosamente. Recibo generado en consola.");
    }
  };

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  // Mostrar solo para admin o empleado
  if (roleUser !== 'admin' && roleUser !== 'empleado') { // <- roleUser en minúscula
    return null;
  }

  return (
    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handlePago}>
      Pagar en efectivo
    </Button>
  );
}