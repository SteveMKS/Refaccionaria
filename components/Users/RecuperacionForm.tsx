"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase-browser';

export function RecuperacionContraseña({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const lowerCaseEmail = email.toLowerCase().trim();

    try {
      // Primero verificar si el correo existe
      const verifyResponse = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lowerCaseEmail }),
      });

      if (!verifyResponse.ok) {
        setError("No se pudo verificar el correo. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      const { exists } = await verifyResponse.json();

      if (!exists) {
        setMessage("Si el correo está registrado en nuestro sistema, recibirás un enlace para restablecer tu contraseña.");
        setLoading(false);
        return;
      }

      // El correo existe, enviar email de recuperación
      const { error } = await supabase.auth.resetPasswordForEmail(lowerCaseEmail, {
        redirectTo: "https://refaccionaria.vercel.app/ResetPassword",
      });

      setLoading(false);

      if (error) {
        setError(error.message);
      } else {
        setMessage("Se ha enviado un enlace de recuperación a tu correo electrónico.");
      }
    } catch (err) {
      console.error('Error en recuperación:', err);
      setError("Ocurrió un error. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-screen w-full items-center justify-center p-6 md:p-10",
        className
      )}
      {...props}
    >
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Recuperación de Contraseña
          </CardTitle>
          <CardDescription>
            Ingresa tu correo para recibir instrucciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Front@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {message && <p className="text-green-500 text-sm">{message}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Enlace"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              ¿Recordaste tu contraseña?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Iniciar Sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
