"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { TicketModal } from "@/components/cart/Tickets"; // Ajusta la ruta si es distinta

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [recibo, setRecibo] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchRecibo = async () => {
      if (!sessionId) return;

      const { data, error } = await supabase
        .from("recibos")
        .select("*")
        .eq("stripe_session_id", sessionId) // Usa el campo que guardaste del Webhook
        .single();

      if (data) {
        setRecibo(data);
        setModalOpen(true);
      } else {
        console.error("Recibo no encontrado", error);
      }
    };

    fetchRecibo();
  }, [sessionId]);

  if (!recibo) return <div className="p-4 text-center">Procesando pago...</div>;

  return (
    <>
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold">¡Gracias por tu compra!</h1>
        <p className="mt-2">Aquí está tu recibo:</p>
      </div>

      <TicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        productos={recibo.productos} // Asegúrate que este campo sea un array con productos
        total={recibo.total}
        fecha={recibo.fecha}
        hora={recibo.hora}
        cliente={recibo.cliente}
        ticketId={recibo.ticketId}
        metodoPago={recibo.metodo_pago}
      />
    </>
  );
}
