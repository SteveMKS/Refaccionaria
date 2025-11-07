'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TicketModal } from "@/components/cart/Tickets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ReceiptText, CalendarDays, Clock, DollarSign, PackageCheck, Barcode, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ReciboPage() {
  const { ticket_id } = useParams();
  const [recibo, setRecibo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deliverLoading, setDeliverLoading] = useState(false);
  const [note, setNote] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [deliveredByName, setDeliveredByName] = useState<{nombre: string; apellido: string} | null>(null);
  const [currentUserName, setCurrentUserName] = useState<{nombre: string; apellido: string} | null>(null);
  const [showTicket, setShowTicket] = useState(false);

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
              ticket_id,
              entregado,
              entregado_en,
              entregado_por,
              id_user,
              users (
                id,
                nombre,
                apellido,
                correo,
                rol,
                avatar
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
              ticket_id,
              entregado,
              entregado_en,
              entregado_por,
              id_user,
              users (
                id,
                nombre,
                apellido,
                correo,
                rol,
                avatar
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
        // Si ya está entregado y hay un entregado_por, traer nombre y apellido
        if (data.entregado && data.entregado_por) {
          try {
            const { data: entregador } = await supabase
              .from('users')
              .select('nombre, apellido')
              .eq('id', data.entregado_por)
              .single();
            if (entregador) {
              setDeliveredByName({ nombre: entregador.nombre, apellido: entregador.apellido });
            }
          } catch (e) {
            console.warn('No se pudo obtener el nombre de quien entregó:', e);
          }
        } else {
          setDeliveredByName(null);
        }
      }

      setLoading(false);
    };

    const fetchRole = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;
      setUserId(uid);
      const { data: userData } = await supabase
        .from('users')
        .select('rol, nombre, apellido')
        .eq('id', uid)
        .single();
      setRole(userData?.rol || null);
      if (userData) {
        setCurrentUserName({ nombre: userData.nombre, apellido: userData.apellido });
      }
    };

    if (ticket_id) {
      fetchRecibo();
      fetchRole();
    }
  }, [ticket_id]);

  const isStaff = role === 'admin' || role === 'empleado';
  const scanPath = isStaff ? '/Admin/Scan' : '/Scan';

  const handleMarkDelivered = async () => {
    if (!recibo) return;
    setDeliverLoading(true);
    try {
      const { data, error } = await supabase
        .from('recibos')
        .update({
          entregado: true,
          entregado_en: new Date().toISOString(),
          entrega_nota: note || null,
          entregado_por: userId || null,
          // entregado_por se llenará con un trigger o aquí si la política lo permite
        })
        .eq('id_recibo', recibo.id_recibo)
        .eq('entregado', false);

      if (error) throw error;

      // Registro opcional en una tabla de auditoría, si existe (recibo_entregas)
      try {
        await supabase.from('recibo_entregas').insert({
          id_recibo: recibo.id_recibo,
          by_user: userId,
          nota: note || null,
        });
      } catch (e) {
        // Ignorar si la tabla no existe o RLS lo impide
        console.warn('Auditoría de entrega no registrada:', e);
      }

      setRecibo({ ...recibo, entregado: true, entregado_en: new Date().toISOString(), entrega_nota: note || null, entregado_por: userId || null });
      if (currentUserName) setDeliveredByName(currentUserName);
      setConfirmOpen(false);
    } catch (e) {
      console.error('No se pudo marcar como entregado', e);
      alert('No se pudo marcar como entregado. Verifica permisos y que el campo exista en la base de datos.');
    } finally {
      setDeliverLoading(false);
    }
  };

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
    <div className="max-w-2xl mx-auto my-8 rounded-xl shadow-lg overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700">
      {/* Encabezado estilo Mis Ventas */}
      <div className={cn(
        "px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-500",
        "dark:from-indigo-800 dark:to-blue-700",
        "text-white"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ReceiptText className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">Recibo #{recibo.id_recibo.substring(0,8)}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{recibo.metodo_pago}</span>
            {recibo?.entregado ? (
              <span className="text-xs bg-emerald-400/25 text-white px-3 py-1 rounded-full border border-emerald-300/30">Entregado</span>
            ) : (
              <span className="text-xs bg-yellow-400/25 text-white px-3 py-1 rounded-full border border-yellow-300/30">Entrega pendiente</span>
            )}
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-6">
        {/* Tarjetas de info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm font-medium">Fecha</span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {new Date(recibo.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Hora</span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">{recibo.hora}</p>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${Number(recibo.total ?? 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Cliente */}
        <div className="mb-6 p-4 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center justify-between">
            <span className="flex items-center">
              {recibo.users?.avatar ? (
                <img src={recibo.users.avatar} alt={recibo.users.nombre || 'Avatar'} className="w-6 h-6 rounded-full mr-2 object-cover" />
              ) : (
                <svg className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
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
              )}>{recibo.users.rol}</span>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Nombre Completo</div>
              <div className="font-medium text-slate-900 dark:text-white">{recibo.users ? `${recibo.users.nombre} ${recibo.users.apellido || ''}`.trim() : 'Cliente General'}</div>
            </div>
            {recibo.users?.correo && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Correo</div>
                <div className="font-medium text-slate-900 dark:text-white break-all">{recibo.users.correo}</div>
              </div>
            )}
            <div className="space-y-1 md:col-span-2">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">ID Recibo</div>
              <div className="font-medium text-slate-900 dark:text-white font-mono text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-md select-all">{recibo.id_recibo}</div>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            <PackageCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Productos
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-700 text-left text-muted-foreground">
                  <th className="p-3">Producto</th>
                  <th className="p-3 text-center">Cantidad</th>
                  <th className="p-3 text-center">P. Unitario</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recibo.productos?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-t hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {item.imagen_principal && (
                          <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-200 dark:border-zinc-700">
                            <img src={item.imagen_principal} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/default-product.png'; }} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {item.id && <p>ID: {item.id}</p>}
                            {item.descripcion && <p>{item.descripcion}</p>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-center">${Number(item.price).toFixed(2)}</td>
                    <td className="p-3 text-right font-medium">{(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="mt-2 mb-6 flex justify-between items-center text-lg">
          <span className="font-medium text-slate-700 dark:text-slate-300">Total</span>
          <span className="font-bold text-slate-900 dark:text-white tabular-nums">${Number(recibo.total ?? 0).toFixed(2)}</span>
        </div>

        {/* Acciones de entrega (solo staff) */}
        {isStaff && (
          <div className="mt-4 p-4 border rounded-lg dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50">
            {recibo?.entregado ? (
              <div className="flex flex-col gap-1 text-emerald-700 dark:text-emerald-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>
                    Entregado {recibo.entregado_en ? `el ${new Date(recibo.entregado_en).toLocaleString()}` : ''}
                    {deliveredByName ? ` por ${deliveredByName.nombre} ${deliveredByName.apellido}` : ''}
                  </span>
                </div>
                {recibo.entrega_nota && (
                  <span className="text-xs text-emerald-800/80 dark:text-emerald-300/80">Nota: {recibo.entrega_nota}</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <label className="text-sm text-muted-foreground">Nota (opcional)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md border bg-background p-2 text-sm" placeholder="Observaciones de entrega, nombre de quien recibe, etc." />
                <div>
                  <Button onClick={() => setConfirmOpen(true)} disabled={deliverLoading}>
                    {deliverLoading ? 'Marcando...' : 'Marcar como entregado'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer con Ticket ID e imprimir */}
        <div className="mt-8 pt-4 border-t dark:border-zinc-700 flex items-center justify-between text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4" />
              <span>Ticket ID: {recibo.ticket_id || recibo.id_recibo.substring(0,8)}</span>
            </div>
            {recibo.entregado && deliveredByName && (
              <div className="sm:pl-3 sm:border-l sm:border-gray-300 dark:sm:border-zinc-700">
                Entregado por: {deliveredByName.nombre} {deliveredByName.apellido}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={scanPath}>Escanear otro ticket</Link>
            </Button>
            <Button variant="outline" onClick={() => setShowTicket(true)}>Reimprimir Ticket</Button>
          </div>
        </div>
      </div>

      {/* Confirmación */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar entrega</DialogTitle>
            <DialogDescription>Esta acción marcará el ticket como entregado y evitará entregas duplicadas.</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">Recibo #{recibo.id_recibo.substring(0,8)}</div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleMarkDelivered} disabled={deliverLoading}>{deliverLoading ? 'Procesando...' : 'Confirmar'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal para reimprimir el ticket original */}
      {showTicket && (
        <TicketModal
          open={showTicket}
          onClose={() => setShowTicket(false)}
          productos={(recibo.productos || []).map((p: any) => ({
            id: p.id || p.id_producto || p.id,
            name: p.name || p.nombre || 'Producto',
            price: Number(p.price ?? p.precio ?? 0),
            quantity: Number(p.quantity ?? p.cantidad ?? 1),
            imagen_principal: p.imagen_principal,
            descripcion: p.descripcion,
          }))}
          total={Number(recibo.total ?? 0)}
          fecha={new Date(recibo.fecha).toLocaleDateString('es-MX')}
          hora={recibo.hora}
          cliente={recibo.users ? `${recibo.users.nombre} ${recibo.users.apellido || ''}`.trim() : 'Cliente General'}
          ticketId={recibo.ticket_id || recibo.id_recibo}
          metodoPago={recibo.metodo_pago}
        />
      )}
    </div>
  );
}
