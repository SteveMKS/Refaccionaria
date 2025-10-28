"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
                        <div key={p.id_recibo} className="flex items-center justify-between rounded-md border p-3">
                          <div>
                            <div className="text-sm font-medium">Compra #{p.id_recibo.substring(0, 8)}...</div>
                            <div className="text-xs text-muted-foreground">{new Date(p.fecha).toLocaleDateString()}</div>
                          </div>
                          <div className="text-sm text-muted-foreground">${Number(p.total).toFixed(2)}</div>
                        </div>
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
                      <div key={p.id_recibo} className={cn('p-4 rounded-lg border hover:bg-accent/40 transition-colors', 'border-border bg-background')}>
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-medium">Compra #{p.id_recibo.substring(0, 8)}...</div>
                          <div className="text-sm text-muted-foreground">{new Date(p.fecha).toLocaleDateString()}</div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Total: ${Number(p.total).toFixed(2)}</div>
                      </div>
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
    </div>
  );
}
