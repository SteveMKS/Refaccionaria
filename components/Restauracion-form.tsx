"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Nuevacontraseña() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
    const token = hashParams.get("access_token");
    
    if (!token) {
      setError("Token no valido. Intentalo de nuevo.");
    } else {
      setAccessToken(token);
    }
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
  
    console.log("Iniciando actualizacion de contraseña...");
  
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }
  
    if (!accessToken) {
      setError("Token no valido. Intentalo de nuevo.");
      setLoading(false);
      return;
    }
  
    try {
      console.log("Intentando iniciar sesión con el token de recuperación...");
      
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "email",
        options: { access_token: accessToken },
      });
  
      if (signInError) {
        console.error("Error al iniciar sesión con el token:", signInError);
        setError("No se pudo autenticar la sesión.");
        setLoading(false);
        return;
      }
  
      console.log("Sesión iniciada correctamente.");
  
      console.log("Enviando solicitud de actualización de contraseña...");
      const { error } = await supabase.auth.updateUser({ password });
  
      if (error) {
        console.error("Error en Supabase:", error);
        setError(error.message);
      } else {
        console.log("Contraseña actualizada exitosamente.");
        setMessage("Contraseña actualizada exitosamente. Redirigiendo...");
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Ocurrió un error inesperado. Intentalo más tarde.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Actualizar Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Escribe tu nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repite tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {message && <p className="text-green-500 text-sm">{message}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Actualizando..." : "Actualizar Contraseña"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// 🟢 La solución: envolver en <Suspense>
export function NuevaContraseña() {
  return (
    <Suspense fallback={<p className="text-center">Cargando...</p>}>
      <Nuevacontraseña />
    </Suspense>
  );
}
