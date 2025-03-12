"use client";

import { usePathname } from "next/navigation";  
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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

export default function PerfilUsuario() {
  const pathname = usePathname();  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";  // Redirige si no hay sesión
      } else {
        await fetchUserProfile(session.user.id);
        setLoading(false);
      }
    };

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
        .from("Login")
        .select("id, fecha_hora, ip")
        .eq("id_usuario", profile.id)
        .order("fecha_hora", { ascending: false })
        .limit(5);

      if (historyError) {
        setError("Error al obtener el historial de inicios de sesión.");
        return;
      }

      setLoginHistory(history);
    };

    checkSession();
  }, [pathname]);

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
            <Button className="w-full" onClick={() => supabase.auth.signOut()}>
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
