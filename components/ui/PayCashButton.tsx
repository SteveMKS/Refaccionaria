'use client';

import { useCart } from "@/hooks/useCart";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PagoEfectivoButton() {
  const checkoutEfectivo = useCart((state) => state.checkoutEfectivo);

  const handlePago = async () => {
    const result = await checkoutEfectivo();

    if (result?.error) {
      toast.error("Hubo un error al realizar el pago.");
    } else {
      toast.success("Pago registrado exitosamente. Recibo generado en consola.");
    }
  };

  return (
    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handlePago}>
      Pagar en efectivo
    </Button>
  );
}
