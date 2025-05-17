// app/Payments/success/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider/Auth";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    toast.success("Pago realizado con éxito");
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <CheckCircle className="w-16 h-16 text-green-500" />
      <h1 className="text-3xl font-bold">¡Pago Exitoso!</h1>
      <p className="text-muted-foreground">
        Tu pedido ha sido procesado correctamente
      </p>
      <div className="flex gap-4 mt-6">
        <Button onClick={() => router.push("/")}>Ir al Inicio</Button>
        <Button variant="outline" onClick={() => router.push("/Compras")}>
          Ver mis pedidos
        </Button>
      </div>
    </div>
  );
}