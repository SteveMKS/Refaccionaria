"use client";

import { useState } from "react";
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
import router from "next/router";
import { useEffect } from "react";

export function RegistroForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session }, } = await supabase.auth.getSession();
          if (session?.user) {
            router.push("/Perfil");
          }
        }
      checkSession();
    }, []);

  // Función de registro con Supabase
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    const lowerCaseEmail = email.toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: lowerCaseEmail,
      password,
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    
    const user = data.user;
    
    if (user) {
      const { error: userError } = await supabase
        .from("users")
        .insert([
          {
            id: user.id,
            nombre,
            apellido,
            correo: lowerCaseEmail,
            created_at: new Date().toISOString(),
          },
        ]);
    
      if (userError) {
        setError("Error al guardar datos adicionales: " + userError.message);
        setLoading(false);
        return;
      }
    
      if (data.session) {
        console.log("Sesión iniciada:", data.session);
        setSuccess("Registro exitoso. Redirigiendo...");
        router.push("/login");
      } else {
        setSuccess("Registro exitoso. Revisa tu correo para verificar tu cuenta.");
      }
    }
    
    setLoading(false);
    
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
          <CardTitle className="text-2xl text-center">Registrarse</CardTitle>
          <CardDescription>
            Crea una cuenta ingresando tu correo y contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Clic Aquí"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  type="text"
                  placeholder="Clic Aquí"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Refas@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
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
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-500 text-sm">{success}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registrando..." : "Registrarse"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{" "}
              <a href="/login" className="underline underline-offset-4">
                Iniciar Sesión
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}