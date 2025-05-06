"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useParams } from "next/navigation";

export default function ReciboPage() {
  const { ticket_id } = useParams();
  const [recibo, setRecibo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecibo = async () => {
      const { data, error } = await supabase
        .from("recibos")
        .select("id_recibo, fecha, hora, metodo_pago, total, productos")
        .eq("ticket_id", ticket_id)
        .single();

      if (!error && data) {
        setRecibo(data);
      }

      setLoading(false);
    };

    if (ticket_id) {
      fetchRecibo();
    }
  }, [ticket_id]);

  if (loading) {
    return <div className="p-6 text-center">Cargando recibo...</div>;
  }

  if (!recibo) {
    return <div className="p-6 text-center text-red-600">Recibo no encontrado.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 border rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-4">
        Recibo #{recibo.id_recibo.substring(0, 8)}
      </h1>
      <p><strong>Fecha:</strong> {recibo.fecha}</p>
      <p><strong>Hora:</strong> {recibo.hora}</p>
      <p><strong>Método de pago:</strong> {recibo.metodo_pago}</p>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Productos:</h2>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-200">
              <th className="text-left px-2 py-1">Producto</th>
              <th className="text-center px-2 py-1">Cant</th>
              <th className="text-center px-2 py-1">P. Unit</th>
              <th className="text-right px-2 py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {recibo.productos?.map((item: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="px-2 py-1">{item.name}</td>
                <td className="text-center px-2 py-1">{item.quantity}</td>
                <td className="text-center px-2 py-1">${item.price.toFixed(2)}</td>
                <td className="text-right px-2 py-1">
                  ${(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-right mt-4 font-bold text-lg">
        TOTAL: ${recibo.total.toFixed(2)}
      </p>
    </div>
  );
}
