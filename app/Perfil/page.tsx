"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  created_at: string;
}

interface LoginHistory {
  id: number;
  fecha_hora: string;
  ip: string;
}

const PerfilUsuario = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/login");
      router.refresh();
    } else {
      setError("Error al cerrar sesión");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.push("/login");
          return;
        }

        // Obtener perfil de usuario
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("id, nombre, apellido, correo, created_at")
          .eq("id", session.user.id)
          .single();

        if (profileError) throw profileError;
        setUserProfile(profile);

        // Obtener historial de logins
        const { data: history, error: historyError } = await supabase
          .from("login")
          .select("id, fecha_hora, ip")
          .eq("user_id", profile.id)
          .order("fecha_hora", { ascending: false })
          .limit(5);

        if (historyError) throw historyError;
        setLoginHistory(history || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pathname, router, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-10 w-full mt-6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Perfil de Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-500 text-center p-2 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {userProfile && (
            <div className="space-y-3">
              <div className="border-b pb-3">
                <p className="text-sm text-muted-foreground">Nombre completo</p>
                <p className="font-medium">
                  {userProfile.nombre} {userProfile.apellido}
                </p>
              </div>
              
              <div className="border-b pb-3">
                <p className="text-sm text-muted-foreground">Correo electrónico</p>
                <p className="font-medium">{userProfile.correo}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Miembro desde</p>
                <p className="font-medium">
                  {new Date(userProfile.created_at).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          <div className="pt-4">
            <h3 className="text-lg font-semibold mb-2">Historial de accesos</h3>
            <ul className="space-y-2">
              {loginHistory.length > 0 ? (
                loginHistory.map((log) => (
                  <li key={log.id} className="text-sm border-b pb-2">
                    <p className="font-medium">
                      {new Date(log.fecha_hora).toLocaleString('es-MX')}
                    </p>
                    <p className="text-muted-foreground">IP: {log.ip}</p>
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay registros de acceso</p>
              )}
            </ul>
          </div>

          <div className="pt-6">
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleLogout}
            >
              Cerrar sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilUsuario;
/*"use client";

import { usePathname, useRouter } from "next/navigation";  // Asegúrate de que uses 'useRouter'
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  created_at: string;
}

interface LoginHistory {
  id: number;
  fecha_hora: string;
  ip: string;
}

const PerfilUsuario = () => {
  const router = useRouter(); // Usa useRouter para las redirecciones
  const pathname = usePathname();  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login"); // Usa router.push para redirigir
    router.refresh(); // Forzar actualización del estado
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
  
      if (!session || error) {
        router.push("/login"); // Si no hay sesión, redirige al login
        return;
      }
  
      await fetchUserProfile(session.user.id);
      setLoading(false);
    };
  
    checkSession();

    const fetchUserProfile = async (userId: string) => {
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id, nombre, apellido, correo, created_at")
        .eq("id", userId)
        .single();

      if (profileError) {
        setError("Error al obtener los datos del perfil.");
        return;
      }

      setUserProfile(profile);

      const { data: history, error: historyError } = await supabase
      .from("login")
      .select("id, fecha_hora, ip")
      .eq("user_id", profile.id)  // Cambia `id_usuario` por el nombre correcto
      .order("fecha_hora", { ascending: false })
      .limit(5);    

      if (historyError) {
        setError("Error al obtener el historial de inicios de sesión.");
        return;
      }

      setLoginHistory(history);
    };

    checkSession();
  }, [pathname, router]); // Asegúrate de agregar 'router' a las dependencias

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin w-10 h-10 border-t-4 border-blue-500 rounded-full"></div>
        <p className="ml-3 text-gray-700">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Perfil de Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500">{error}</p>}

          {userProfile && (
            <div className="flex flex-col gap-4">
              <p>
                <strong>Nombre:</strong> {userProfile.nombre} {userProfile.apellido}
              </p>
              <p>
                <strong>Correo:</strong> {userProfile.correo}
              </p>
              <p>
                <strong>Fecha de creación:</strong>{" "}
                {new Date(userProfile.created_at).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Historial de Inicios de Sesión</h3>
            <ul className="list-disc pl-5 text-sm text-gray-700">
              {loginHistory.map((log) => (
                <li key={log.id}>
                  {new Date(log.fecha_hora).toLocaleString()} - IP: {log.ip}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <Button className="w-full" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilUsuario;*/