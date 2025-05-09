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
              "sm:max-w-2xl p-6 rounded-2xl shadow-xl border bg-white dark:bg-zinc-900 dark:border-zinc-800",
              "transition-all animate-in fade-in zoom-in"
            )}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <ReceiptText className="w-5 h-5 text-primary" />
                Recibo #{selectedVenta.id_recibo.substring(0, 8)}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Detalles del recibo
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span>
                  <strong>Fecha:</strong> {selectedVenta.fecha}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span>
                  <strong>Hora:</strong> {selectedVenta.hora}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>
                  <strong>Total:</strong> ${selectedVenta.total.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Barcode className="w-5 h-5 text-primary" />
                <span>
                  <strong>Método de pago:</strong> {selectedVenta.metodo_pago}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <PackageCheck className="w-5 h-5 text-primary mt-1" />
                <div className="space-y-1 w-full">
                  <strong>Productos:</strong>
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-muted text-muted-foreground">
                        <th className="text-left px-2 py-1">Producto</th>
                        <th className="text-center px-2 py-1">Cant</th>
                        <th className="text-center px-2 py-1">P. Unit</th>
                        <th className="text-right px-2 py-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVenta.productos?.map((item: any, idx: number) => (
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
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={() => setModalOpen(false)}>Cerrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
/*"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { format } from "date-fns";

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

  if (!authChecked || loading) {
    return <div className="p-6 text-center animate-pulse">Cargando ventas...</div>;
  }

  const filteredVentas = ticketIdSearch ? filterVentasByTicketId(ticketIdSearch) : ventas;

  return (
    <div className="max-w-5xl mx-auto p-6 rounded-xl shadow-lg animate__animated animate__fadeIn bg-white dark:bg-gray-900">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-wide">
        Ventas realizadas
      </h1>

      {/* Filtro de búsqueda por TicketID }
      <div className="mb-6 flex justify-center items-center">
        <input
          type="text"
          value={ticketIdSearch}
          onChange={(e) => setTicketIdSearch(e.target.value)}
          placeholder="Buscar por Ticket ID (primeros 8 dígitos)"
          className="p-3 w-80 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-gray-700 dark:text-white dark:border-gray-600 transition duration-300"
        />
      </div>

      {/* Totales vendidos }
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
                    <a
                      href={`/recibos/${venta.ticket_id}`}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline transition duration-300"
                    >
                      Ver recibo
                    </a>
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
    </div>
  );
}*/