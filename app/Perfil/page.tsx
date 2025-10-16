"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-3xl font-bold mb-4">Mi Perfil</h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Perfil Card */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Perfil</CardTitle>
              <CardDescription className="text-muted-foreground">Detalles de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <p className="text-red-500 mb-2">{error}</p>}

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {userProfile ? (userProfile.nombre?.charAt(0) + (userProfile.apellido?.charAt(0) || '')).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="font-semibold">{userProfile ? `${userProfile.nombre} ${userProfile.apellido}` : 'Usuario'}</div>
                  <div className="text-sm text-muted-foreground">{userProfile?.correo}</div>
                  <div className="text-xs text-muted-foreground mt-1">Miembro desde {userProfile ? new Date(userProfile.created_at).toLocaleDateString() : '-'}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => router.push('/Compras')}>
                  Ver Mis Compras
                </Button>
                <Button variant="outline" className="w-full" onClick={handleLogout}>Cerrar sesión</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent activity / purchases */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} className="md:col-span-2">
          <div className="grid grid-cols-1 gap-6">
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
                      <div key={p.id_recibo} className={cn('p-4 rounded-lg border', 'border-border bg-background')}>
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

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Actividad de sesión</CardTitle>
                <CardDescription className="text-muted-foreground">Tus últimos inicios de sesión</CardDescription>
              </CardHeader>
              <CardContent>
                {loginHistory.length === 0 ? (
                  <div className="text-muted-foreground">No hay actividad reciente.</div>
                ) : (
                  <ul className="list-disc pl-5 text-sm">
                    {loginHistory.map((h, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{new Date(h).toLocaleString()}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
