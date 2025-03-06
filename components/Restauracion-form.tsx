"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Nuevacontraseña() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = searchParams.get("access_token");

  useEffect(() => {
    if (!accessToken) {
      setError("Token no válido. Inténtalo de nuevo.");
    }
  }, [accessToken]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    if (!accessToken) {
      setError("Token no válido. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Contraseña actualizada exitosamente. Redirigiendo...");
      setTimeout(() => router.push("/login"), 3000);
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
