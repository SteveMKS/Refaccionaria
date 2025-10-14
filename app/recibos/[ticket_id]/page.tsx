'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ReciboPage() {
  const { ticket_id } = useParams();
  const [recibo, setRecibo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecibo = async () => {
      let data = null;
      let error = null;

      console.log("Buscando ticket_id:", ticket_id);
      // Si el ticket_id es string
      if (typeof ticket_id === "string") {
        // Si el ticket_id parece un UUID, busca por ticket_id
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticket_id)) {
          const res = await supabase
            .from("recibos")
            .select(`
              id_recibo,
              fecha,
              hora,
              metodo_pago,
              total,
              productos,
              id_user,
              users (
                id,
                nombre,
                apellido,
                correo
              )
            `)
            .eq("ticket_id", ticket_id)
            .single();
          data = res.data;
          error = res.error;
          console.log("Datos del recibo:", res.data);
        }
        // Si el ticket_id tiene 8 caracteres, busca por id_recibo que empiece igual
        else if (ticket_id.length === 8) {
          const res = await supabase
            .from("recibos")
            .select(`
              id_recibo,
              fecha,
              hora,
              metodo_pago,
              total,
              productos,
              id_user,
              users (
                id,
                nombre,
                apellido,
                correo
              )
            `)
            .ilike("id_recibo", `${ticket_id}%`)
            .limit(1);
          if (res.data && res.data.length > 0) {
            data = res.data[0];
            error = null;
          } else {
            data = null;
            error = res.error;
          }
        }
      }

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
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-pulse text-slate-600 dark:text-slate-400">
          Cargando recibo...
        </div>
      </div>
    );
  }

  if (!recibo) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-red-600 dark:text-red-400 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Recibo no encontrado</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white px-6 py-4">
        <div className="text-sm text-blue-100 dark:text-blue-200 mb-1">Refaccionaria</div>
        <h1 className="text-2xl font-bold flex items-center justify-between">
          <span>Recibo #{recibo.id_recibo.substring(0, 8)}</span>
          <span className="text-sm font-normal bg-white/20 rounded-full px-3 py-1">
            {recibo.metodo_pago}
          </span>
        </h1>
      </div>

      {/* Información del recibo */}
      <div className="p-6">
        {/* Información del cliente */}
        <div className="mb-8 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center justify-between">
            <span className="flex items-center">
              {recibo.users?.avatar ? (
                <img 
                  src={recibo.users.avatar} 
                  alt={recibo.users.nombre || 'Avatar'} 
                  className="w-6 h-6 rounded-full mr-2 object-cover"
                />
              ) : (
                <svg className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              Información del Cliente
            </span>
            {recibo.users?.rol && (
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                {
                  'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300': recibo.users.rol === 'admin',
                  'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300': recibo.users.rol === 'empleado',
                  'bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300': recibo.users.rol === 'user'
                }
              )}>
                {recibo.users.rol}
              </span>
            )}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre Completo</div>
              <div className="font-medium text-slate-900 dark:text-white">
                {recibo.users ? `${recibo.users.nombre} ${recibo.users.apellido || ''}`.trim() : 'Cliente General'}
              </div>
            </div>
            {recibo.users?.correo && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Correo</div>
                <div className="font-medium text-slate-900 dark:text-white break-all">
                  {recibo.users.correo}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha</div>
              <div className="font-medium text-slate-900 dark:text-white">
                {new Date(recibo.fecha).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Hora</div>
              <div className="font-medium text-slate-900 dark:text-white">
                {new Date(`2000-01-01T${recibo.hora}`).toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }).replace(/\s/g, '').toLowerCase()}
              </div>
            </div>
            <div className="col-span-2">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">ID Recibo</div>
                <div className="font-medium text-slate-900 dark:text-white font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-md select-all">
                  {recibo.id_recibo}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información de la transacción */}
        {/* Tabla de productos */}
        <div className="mt-6 border dark:border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <th className="text-left px-4 py-2 font-medium">Producto</th>
                <th className="text-center px-4 py-2 font-medium">Cant</th>
                <th className="text-right px-4 py-2 font-medium">P. Unit</th>
                <th className="text-right px-4 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recibo.productos?.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="text-center px-4 py-3">{item.quantity}</td>
                  <td className="text-right px-4 py-3 tabular-nums">${item.price.toFixed(2)}</td>
                  <td className="text-right px-4 py-3 tabular-nums font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="mt-6 pt-6 border-t dark:border-slate-800">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium text-slate-700 dark:text-slate-300">Total</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              ${recibo.total.toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 pt-6 border-t dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>Gracias por su compra</p>
          <p className="mt-1">Este documento es un comprobante de venta válido</p>
        </div>
      </div>
    </div>
  );
}
