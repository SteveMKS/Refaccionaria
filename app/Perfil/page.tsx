"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReceiptText, CalendarDays, Clock, DollarSign, PackageCheck, Barcode } from "lucide-react";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  created_at: string;
}

interface PurchasePreview {
  id_recibo: string; // 🔥 Cambiado de 'id' a 'id_recibo'
  fecha: string;
  total: number;
}

export default function PerfilUsuario() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loginHistory, setLoginHistory] = useState<string[]>([]);
  const [purchases, setPurchases] = useState<PurchasePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecibo, setSelectedRecibo] = useState<any | null>(null);
  const [openRecibo, setOpenRecibo] = useState(false);
  const [loadingRecibo, setLoadingRecibo] = useState(false);
  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, nombre, apellido, correo, created_at')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        if (!mounted) return;
        setUserProfile(profile as UserProfile);

        // Fetch recent login timestamps (best-effort)
        const { data: history } = await supabase
          .from('login')
          .select('fecha_hora')
          .eq('user_id', profile.id)
          .order('fecha_hora', { ascending: false })
          .limit(5);

        if (mounted && history) {
          setLoginHistory(history.map((h: any) => h.fecha_hora));
        }

        // 🔥 Fetch recent purchases - CORREGIDO
        const { data: recentPurchases, error: purchasesError } = await supabase
          .from('recibos')
          .select('id_recibo, fecha, total') // ✅ Cambiado 'id' por 'id_recibo'
          .eq('id_user', profile.id) // ✅ Cambiado 'user_id' por 'id_user'
          .order('fecha', { ascending: false })
          .limit(5);

        if (purchasesError) {
          console.error('Error fetching purchases:', purchasesError);
        }

        if (mounted && recentPurchases) {
          setPurchases(recentPurchases.map((r: any) => ({ 
            id_recibo: r.id_recibo, // ✅ Usar id_recibo
            fecha: r.fecha, 
            total: r.total 
          })));
        }

      } catch (err: any) {
        // If any fetch error occurs, show a user-friendly message but continue
        console.error(err);
        setError('No se pudieron cargar algunos datos del perfil.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => { mounted = false; };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.correo) {
      toast.error("No se pudo obtener tu correo para validar la contraseña.");
      return;
    }

    // Validaciones básicas
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Completa todos los campos.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("La confirmación no coincide.");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("La nueva contraseña no puede ser igual a la actual.");
      return;
    }

    setIsUpdatingPw(true);
    try {
      // Reautenticar para verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userProfile.correo,
        password: currentPassword,
      });
      if (signInError) {
        toast.error("La contraseña actual es incorrecta.");
        setIsUpdatingPw(false);
        return;
      }

      // Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        toast.error(updateError.message || "No se pudo actualizar la contraseña.");
        setIsUpdatingPw(false);
        return;
      }

      toast.success("Contraseña actualizada exitosamente. Por seguridad, vuelve a iniciar sesión.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Cerrar sesión y redirigir al login tras breve pausa para mostrar el toast
      setTimeout(() => {
        void supabase.auth.signOut().then(() => {
          router.push('/login');
        });
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error al cambiar la contraseña.");
    } finally {
      setIsUpdatingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-primary" />
      </div>
    );
  }

  const displayName = userProfile ? `${userProfile.nombre} ${userProfile.apellido}`.trim() : 'Usuario';
  const initials = userProfile ? `${userProfile.nombre?.[0] || ''}${userProfile.apellido?.[0] || ''}`.toUpperCase() || 'U' : 'U';

  // Abre el modal y trae el recibo con el mismo modelo que "Mis Ventas"
  const handleOpenRecibo = async (id_recibo: string) => {
    try {
      setLoadingRecibo(true);
      setSelectedRecibo(null);
      setOpenRecibo(true);
      const { data, error } = await supabase
        .from('recibos')
        .select(`
          id_recibo,
          fecha,
          hora,
          metodo_pago,
          total,
          productos,
          ticket_id,
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
        .eq('id_recibo', id_recibo)
        .single();

      if (error) throw error;
      setSelectedRecibo(data);
    } catch (e) {
      console.error('Error cargando recibo:', e);
      toast.error('No se pudo cargar el recibo.');
      setOpenRecibo(false);
    } finally {
      setLoadingRecibo(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl mb-8 border bg-gradient-to-br from-primary/10 via-background to-background"
      >
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative p-6 md:p-8 flex items-center gap-6">
          <div className="shrink-0 h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-primary to-purple-500 p-[2px]">
            <div className="h-full w-full rounded-full bg-background flex items-center justify-center text-lg md:text-2xl font-bold text-primary">
              {initials}
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{displayName}</h1>
            <p className="text-sm text-muted-foreground truncate">{userProfile?.correo}</p>
            <div className="mt-2 text-xs text-muted-foreground">Miembro desde {userProfile ? new Date(userProfile.created_at).toLocaleDateString() : '-'}</div>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/Compras')}>Mis Compras</Button>
            <Button variant="ghost" onClick={handleLogout}>Cerrar sesión</Button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="grid grid-cols-3 w-full md:w-auto md:inline-grid">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
        </TabsList>

        {/* Resumen */}
        <TabsContent value="resumen" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Actividad de sesión */}
            <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} viewport={{ once: true }}>
              <Card className="bg-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Actividad de sesión</CardTitle>
                  <CardDescription className="text-muted-foreground">Tus últimos inicios de sesión</CardDescription>
                </CardHeader>
                <CardContent>
                  {loginHistory.length === 0 ? (
                    <div className="text-muted-foreground">No hay actividad reciente.</div>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {loginHistory.map((h, i) => (
                        <li key={i} className="flex items-center justify-between rounded-md border p-2">
                          <span className="text-muted-foreground">{new Date(h).toLocaleString()}</span>
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Compras recientes (resumen) */}
            <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} viewport={{ once: true }}>
              <Card className="bg-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Compras recientes</CardTitle>
                  <CardDescription className="text-muted-foreground">Un vistazo a tus últimas compras</CardDescription>
                </CardHeader>
                <CardContent>
                  {purchases.length === 0 ? (
                    <div className="py-2 text-sm text-muted-foreground">No se encontraron compras recientes.</div>
                  ) : (
                    <div className="space-y-3">
                      {purchases.slice(0, 3).map((p) => (
                        <button
                          key={p.id_recibo}
                          onClick={() => handleOpenRecibo(p.id_recibo)}
                          className="flex items-center justify-between w-full rounded-md border p-3 hover:bg-accent/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer text-left"
                          aria-label={`Ver detalles de compra ${p.id_recibo.substring(0,8)}`}
                        >
                          <div>
                            <div className="text-sm font-medium">Compra #{p.id_recibo.substring(0, 8)}...</div>
                            <div className="text-xs text-muted-foreground">{new Date(p.fecha).toLocaleDateString()}</div>
                          </div>
                          <div className="text-sm text-muted-foreground">${Number(p.total).toFixed(2)}</div>
                        </button>
                      ))}
                      <div className="pt-1">
                        <Button variant="secondary" size="sm" onClick={() => router.push('/Compras')}>Ver todas</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Compras */}
        <TabsContent value="compras" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Compras recientes</CardTitle>
                <CardDescription className="text-muted-foreground">Un vistazo rápido a tus últimas compras</CardDescription>
              </CardHeader>
              <CardContent>
                {purchases.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    No se encontraron compras recientes.
                    <div className="mt-4">
                      <Button onClick={() => router.push('/Compras')}>Ir a Compras</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {purchases.map(p => (
                      <button
                        key={p.id_recibo}
                        onClick={() => handleOpenRecibo(p.id_recibo)}
                        className={cn('p-4 rounded-lg border hover:bg-accent/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary block cursor-pointer text-left', 'border-border bg-background')}
                        aria-label={`Ver detalles de compra ${p.id_recibo.substring(0,8)}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">Compra #{p.id_recibo.substring(0, 8)}...</div>
                          <div className="text-sm text-muted-foreground">{new Date(p.fecha).toLocaleDateString()}</div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Total: ${Number(p.total).toFixed(2)}</div>
                      </button>
                    ))}
                    <div className="pt-2">
                      <Button variant="ghost" onClick={() => router.push('/Compras')}>Ver historial completo</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Seguridad */}
        <TabsContent value="seguridad" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} viewport={{ once: true }}>
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Cambiar contraseña</CardTitle>
                  <CardDescription className="text-muted-foreground">Actualiza la contraseña de tu cuenta</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Contraseña actual</Label>
                      <Input
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nueva contraseña</Label>
                      <Input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la nueva contraseña"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isUpdatingPw}>
                      {isUpdatingPw ? "Actualizando..." : "Guardar nueva contraseña"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} viewport={{ once: true }}>
              <Card className="bg-card h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Sesión</CardTitle>
                  <CardDescription className="text-muted-foreground">Cierra tu sesión actual de forma segura</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleLogout}>Cerrar sesión</Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
      {/* Modal de Recibo (modelo igual a "Mis Ventas") */}
      {openRecibo && (
        <Dialog open={openRecibo} onOpenChange={setOpenRecibo}>
          <DialogContent
            className={cn(
              "sm:max-w-2xl w-[95vw] h-[90vh] p-0 rounded-xl overflow-hidden flex flex-col",
              "bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800",
              "border border-gray-200 dark:border-zinc-700",
              "shadow-2xl dark:shadow-zinc-950/50",
              "transition-all animate-in fade-in-90 zoom-in-95"
            )}
          >
            {loadingRecibo || !selectedRecibo ? (
              <>
                {/* Título accesible oculto para lectores de pantalla */}
                <DialogHeader className="sr-only">
                  <DialogTitle>Cargando recibo</DialogTitle>
                </DialogHeader>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-primary" />
                    <p>Cargando recibo...</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Encabezado */}
                <div
                  className={cn(
                    "px-6 pr-14 py-4 bg-gradient-to-r from-indigo-600 to-blue-500",
                    "dark:from-indigo-800 dark:to-blue-700",
                    "text-white flex-shrink-0"
                  )}
                >
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ReceiptText className="w-6 h-6" />
                        <DialogTitle className="text-xl font-bold tracking-tight">
                          Recibo #{selectedRecibo.id_recibo.substring(0, 8)}
                        </DialogTitle>
                      </div>
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                        {selectedRecibo.metodo_pago}
                      </span>
                    </div>
                    <DialogDescription className="text-blue-100 dark:text-blue-200">
                      <>
                        <span className="block text-sm">Cliente: {selectedRecibo?.users?.correo || "No disponible"}</span>
                        <span className="block text-sm">Detalles completos de la transacción</span>
                      </>
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Cuerpo */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                        <CalendarDays className="w-4 h-4" />
                        <span className="text-sm font-medium">Fecha</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {new Date(selectedRecibo.fecha).toLocaleDateString('es-ES', {
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
                        {selectedRecibo.hora}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">Total</span>
                      </div>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        ${Number(selectedRecibo.total).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Tabla de productos */}
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
                          {selectedRecibo.productos?.map((item: any, idx: number) => (
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
                              <td className="p-3 text-center">${Number(item.price).toFixed(2)}</td>
                              <td className="p-3 text-right font-medium">
                                ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Pie de página */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center flex-shrink-0">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Barcode className="w-4 h-4" />
                    <span>Ticket ID: {selectedRecibo.ticket_id}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setOpenRecibo(false)}
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
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Modal de Recibo (modelo igual a "Mis Ventas")
// Se renderiza dentro del componente para mantener el estado y el stacking correcto

