"use client";

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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/Perfil'); // Usa `replace` para no acumular historial
      }
    });
  }, []);

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

    try {
      // Verificar primero si el correo ya existe en la BD (usando API segura)
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

      if (exists) {
        setError("El correo ya se encuentra registrado. Por favor inicia sesión o recupera tu contraseña.");
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: lowerCaseEmail,
        password,
        options: {
          data: { nombre, apellido },
          emailRedirectTo: `${window.location.origin}/Perfil`
        }
      });

      if (authError) {
        // Mensaje más amigable si Supabase indica que el usuario ya existe
        const msg = authError.message || String(authError);
        if (/already registered|already exists|User already exists|user already registered/i.test(msg)) {
          setError("El correo ya se encuentra registrado. Intenta iniciar sesión o usar 'Olvidé mi contraseña'.");
          setLoading(false);
          return;
        }

        throw authError;
      }

      if (data.user && !data.session) {
        setSuccess("Registro exitoso. Por favor verifica tu correo electrónico.");
        setTimeout(() => {
          router.push("/login");
        }, 5000); // Espera 5 segundos antes de redirigir
        return;
      }

      if (data.user && data.session) {
        const { error: upsertError } = await supabase
          .from("users")
          .upsert({
            id: data.user.id,
            nombre,
            apellido,
            correo: lowerCaseEmail
          }, { onConflict: 'id' });
      
        if (upsertError) throw upsertError;
      
        setSuccess("Registro exitoso. Redirigiendo en unos segundos...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 5000); // Espera 5 segundos antes de redirigir
      }

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else if (typeof error === 'string') {
        setError(error);
      } else {
        setError("Ocurrió un error desconocido durante el registro.");
        console.error("Error desconocido:", error);
      }
    } finally {
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
                  placeholder="refas@example.com"
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
                  placeholder="Clic Aquí"
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
                  placeholder="Clic Aquí"
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
