"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ Se agregó useSearchParams
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Nuevacontraseña() {
  const [new_password, setnewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams(); // 🔹 Correcto para obtener parámetros de la URL

  // Verifica el token en la URL
  useEffect(() => {
    const token = searchParams.get("token"); // ✅ Obtiene el token correctamente

    if (!token) {
      setError("Token no válido o ha expirado.");
      setLoading(false);
    }
  }, [searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const token = searchParams.get("token"); // ✅ Obtiene el token correctamente

    if (!token) {
      setError("Token no válido o ha expirado.");
      setLoading(false);
      return;
    }

    if (new_password !== confirmPassword) {
      setError("Las contraseñas no coinciden, intente de nuevo.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser(
        { password: new_password },
        { access_token: token } // ✅ El token se pasa correctamente
      );

      if (error) {
        setError(error.message);
        console.error("Ha ocurrido un Error, no se pudo actualizar.");
      } else {
        setMessage("Contraseña actualizada exitosamente.");
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Restablecer tu contraseña</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
      <form onSubmit={handleUpdatePassword}>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={new_password}
          onChange={(e) => setnewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Actualizando..." : "Restablecer Contraseña"}
        </button>
      </form>
    </div>
  );

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
                  value={new_password}
                  onChange={(e) => setnewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
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

export default Nuevacontraseña;