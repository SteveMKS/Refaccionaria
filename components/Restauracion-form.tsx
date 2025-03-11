"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Nuevacontraseña() {
  const [new_password, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get("access_token");

    if (access_token) {
      supabase.auth.setSession({
        access_token,
        refresh_token: access_token, // Requiere ambos en el flujo de recuperación
      });
    } else {
      setError("Token no encontrado. Por favor, intente nuevamente desde el enlace enviado a su correo.");
    }
  }, []);

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault(); // 🔥 ¡Prevenir que el formulario se recargue!

    if (new_password !== confirmPassword) {
      setError("Las contraseñas no coinciden, intente de nuevo.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: new_password });

      if (error) {
        setError("Ha ocurrido un error, no se pudo actualizar la contraseña.");
      } else {
        setMessage("Contraseña actualizada exitosamente.");
        setTimeout(() => router.push("/Perfil"), 3000);
      }
    } catch (err) {
      setError("Error inesperado, intente de nuevo más tarde.");
      console.error(err);
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
                  value={new_password}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              <Button type="submit" className="w-full">
                Actualizar Contraseña
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Nuevacontraseña;
