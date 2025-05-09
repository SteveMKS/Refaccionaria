"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ReceiptText,
  CalendarDays,
  Clock,
  DollarSign,
  PackageCheck,
  Barcode,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function VentasAdminPage() {
  const router = useRouter();
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [ticketIdSearch, setTicketIdSearch] = useState<string>("");
  const [totalVendido, setTotalVendido] = useState({
    dia: 0,
    semana: 0,
    mes: 0,
  });
  const [selectedVenta, setSelectedVenta] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Función para buscar ventas por TicketID (primeros 8 dígitos)
  const filterVentasByTicketId = (ticketId: string) => {
    return ventas.filter((venta) =>
      venta.ticket_id?.slice(0, 8).includes(ticketId)
    );
  };

  useEffect(() => {
    const checkRoleAndFetch = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;

      if (!userId) {
        router.push("/"); // No autenticado
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("rol")
        .eq("id", userId)
        .single();

      if (userError || !["admin", "empleado"].includes(userData?.rol)) {
        router.push("/"); // No autorizado
        return;
      }

      setAuthChecked(true);

      // Obtener ventas y calcular totales
      const { data: ventasData, error: ventasError } = await supabase
        .from("recibos")
        .select("id_recibo, fecha, hora, total, metodo_pago, ticket_id, productos, creado_en")
        .order("creado_en", { ascending: false });

      if (!ventasError) {
        setVentas(ventasData);
        calculateTotals(ventasData);
      }

      setLoading(false);
    };

    checkRoleAndFetch();
  }, [router]);

  const calculateTotals = (ventasData: any[]) => {
    let totalDia = 0;
    let totalSemana = 0;
    let totalMes = 0;
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    ventasData.forEach((venta) => {
      const ventaFecha = new Date(venta.fecha);
      if (ventaFecha.toDateString() === new Date().toDateString()) {
        totalDia += parseFloat(venta.total);
      }
      if (ventaFecha >= startOfWeek) {
        totalSemana += parseFloat(venta.total);
      }
      if (ventaFecha >= startOfMonth) {
        totalMes += parseFloat(venta.total);
      }
    });

    setTotalVendido({
      dia: totalDia,
      semana: totalSemana,
      mes: totalMes,
    });
  };

  const handleOpenModal = (venta: any) => {
    setSelectedVenta(venta);
    setModalOpen(true);
  };

  if (!authChecked || loading) {
    return <div className="p-6 text-center animate-pulse">Cargando ventas...</div>;
  }

  const filteredVentas = ticketIdSearch ? filterVentasByTicketId(ticketIdSearch) : ventas;

  return (
    <div className="max-w-5xl mx-auto p-6 rounded-xl shadow-lg animate__animated animate__fadeIn bg-white dark:bg-gray-900">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-wide">
        Ventas realizadas
      </h1>

      {/* Filtro de búsqueda por TicketID */}
      <div className="mb-6 flex justify-center items-center">
        <input
          type="text"
          value={ticketIdSearch}
          onChange={(e) => setTicketIdSearch(e.target.value)}
          placeholder="Buscar por Ticket ID (primeros 8 dígitos)"
          className="p-3 w-80 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-300"
        />
      </div>

      {/* Totales vendidos */}
      <div className="mb-8 grid grid-cols-3 gap-8 text-center">
        <div className="bg-white p-6 rounded-lg shadow-xl dark:bg-gray-800 dark:text-white transform hover:scale-105 transition duration-300">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Total Hoy</h2>
          <p className="text-3xl text-indigo-600 font-bold">${totalVendido.dia.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-xl dark:bg-gray-800 dark:text-white transform hover:scale-105 transition duration-300">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Total esta Semana</h2>
          <p className="text-3xl text-indigo-600 font-bold">${totalVendido.semana.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-xl dark:bg-gray-800 dark:text-white transform hover:scale-105 transition duration-300">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Total este Mes</h2>
          <p className="text-3xl text-indigo-600 font-bold">${totalVendido.mes.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-xl dark:bg-gray-800 dark:text-white">
        <table className="min-w-full text-sm table-auto">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr className="text-left text-gray-700 dark:text-gray-200">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">Método de pago</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Ticket ID</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredVentas.length > 0 ? (
              filteredVentas.map((venta) => (
                <tr
                  key={venta.id_recibo}
                  className="border-t transition-transform duration-300 hover:bg-indigo-50 dark:hover:bg-indigo-700"
                >
                  <td className="px-4 py-3">{format(new Date(venta.fecha), "dd/MM/yyyy")}</td>
                  <td className="px-4 py-3">{venta.hora}</td>
                  <td className="px-4 py-3">{venta.metodo_pago}</td>
                  <td className="px-4 py-3 font-semibold">${venta.total.toFixed(2)}</td>
                  <td className="px-4 py-3">{venta.ticket_id?.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleOpenModal(venta)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline transition duration-300"
                    >
                      Ver recibo
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-600 dark:text-gray-400">
                  No se encontraron ventas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {ventas.length === 0 && (
        <p className="mt-6 text-gray-600 dark:text-gray-400 text-center">No hay ventas registradas.</p>
      )}

      {/* Modal de detalle de recibo */}
      {selectedVenta && (
  <Dialog open={modalOpen} onOpenChange={setModalOpen}>
    <DialogContent
      className={cn(
        "sm:max-w-2xl max-w-[95vw] max-h-[90vh] p-0 rounded-xl overflow-hidden",
        "bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800",
        "border border-gray-200 dark:border-zinc-700",
        "shadow-2xl dark:shadow-zinc-950/50",
        "transition-all animate-in fade-in-90 zoom-in-95"
      )}
    >
      {/* Encabezado con fondo azul gradiente */}
      <div className={cn(
        "px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-500",
        "dark:from-indigo-800 dark:to-blue-700",
        "text-white"
      )}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ReceiptText className="w-6 h-6" />
              <DialogTitle className="text-xl font-bold tracking-tight">
                Recibo #{selectedVenta.id_recibo.substring(0, 8)}
              </DialogTitle>
            </div>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              {selectedVenta.metodo_pago}
            </span>
          </div>
          <DialogDescription className="text-blue-100 dark:text-blue-200">
            Detalles completos de la transacción
          </DialogDescription>
        </DialogHeader>
      </div>

      {/* Cuerpo del modal con scroll */}
      <div className="p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm font-medium">Fecha</span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {new Date(selectedVenta.fecha).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Hora</span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {selectedVenta.hora}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              ${selectedVenta.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Tabla de productos mejorada */}
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
                {selectedVenta.productos?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-t hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {item.imagen_principal && (
                          <div className="w-10 h-10 rounded-md overflow-hidden border border-gray-200 dark:border-zinc-700">
                            <img 
                              src={item.imagen_principal} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/default-product.png';
                              }}
                            />
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
                    <td className="p-3 text-center">${item.price.toFixed(2)}</td>
                    <td className="p-3 text-right font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pie de página fijo */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Barcode className="w-4 h-4" />
          <span>Ticket ID: {selectedVenta.ticket_id}</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setModalOpen(false)}
            className="border-gray-300 dark:border-zinc-600"
          >
            Cerrar
          </Button>
          <Button 
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800"
          >
            Imprimir
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)}
    </div>
  );
}