"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { TicketModal } from "@/components/cart/Tickets";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

export default function SuccessPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [recibo, setRecibo] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [Error, setError] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!sessionId) {
      console.error("No se recibió session_id en la URL");
      setError("No se recibió ID de sesión. Esto puede ocurrir si llegaste a esta página directamente sin completar un pago.");
      setLoading(false);
      return;
    }

    const fetchReciboConReintentos = async () => {
      const maxIntentos = 10;
      const delay = 2000; // 2 segundos entre intentos

      const intentar = async () => {
        console.log(`Intento #${intentos + 1} de buscar recibo para sesión: ${sessionId}`);
        
        // Primero intentamos con stripe_session_id
        let { data, error } = await supabase
          .from("recibos")
          .select("*")
          .eq("stripe_session_id", sessionId)
          .single();
        
        // Si no se encuentra, intentamos con stripe_session
        if (!data && !error) {
          console.log("No se encontró con stripe_session_id, intentando con stripe_session");
          ({ data, error } = await supabase
            .from("recibos")
            .select("*")
            .eq("stripe_session", sessionId)
            .single());
        }

        if (data) {
          console.log("¡Recibo encontrado!", data);
          setRecibo(data);
          setModalOpen(true);
          setLoading(false);
        } else if (intentos < maxIntentos) {
          console.log(`Recibo no encontrado. Reintentando en ${delay}ms...`, error);
          
          // Después del 5to intento, consultamos el endpoint de verificación
          if (intentos === 5) {
            try {
              const response = await fetch(`/api/verify-receipt?session_id=${sessionId}`);
              const debugData = await response.json();
              setDebugInfo(debugData);
              console.log("Información de depuración:", debugData);
            } catch (e) {
              console.error("Error obteniendo información de depuración:", e);
            }
          }
          
          setTimeout(() => {
            setIntentos((prev) => prev + 1);
          }, delay);
        } else {
          console.error("Recibo no encontrado después de varios intentos:", error);
          
          // Intentar obtener información de depuración si no se hizo antes
          if (!debugInfo) {
            try {
              const response = await fetch(`/api/verify-receipt?session_id=${sessionId}`);
              const debugData = await response.json();
              setDebugInfo(debugData);
              console.log("Información de depuración final:", debugData);
            } catch (e) {
              console.error("Error obteniendo información de depuración:", e);
            }
          }
          
          setError("No pudimos encontrar tu recibo. Por favor contacta a soporte con este ID: " + sessionId);
          setLoading(false);
        }
      };

      intentar();
    };

    fetchReciboConReintentos();
  }, [sessionId, intentos, supabase, debugInfo]);

  const handleCloseModal = () => {
    setModalOpen(false);
    // Redirigir al usuario a la página principal después de cerrar el modal
    setTimeout(() => router.push("/"), 500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-center mb-2">
          Procesando tu pago...
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          Estamos confirmando tu transacción. Esto puede tardar unos segundos.
          (Intento {intentos + 1}/10)
        </p>
      </div>
    );
  }

  if (Error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-center mb-4 text-red-700">
            Hubo un problema
          </h2>
          <p className="text-center mb-6 text-gray-700">{Error}</p>
          <div className="flex flex-col space-y-4">
            <Button onClick={() => router.push("/")} className="bg-primary hover:bg-primary/90">
              Volver a la tienda
            </Button>
            
            {sessionId && (
              <Button 
                variant="outline" 
                onClick={() => setShowDebug(!showDebug)}
                className="text-sm"
              >
                {showDebug ? "Ocultar" : "Mostrar"} información técnica
              </Button>
            )}
          </div>
          
          {showDebug && debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-700 mb-2">¡Gracias por tu compra!</h1>
          <p className="text-gray-700 mb-6">
            Tu pago ha sido procesado correctamente. Puedes ver los detalles de tu compra en el recibo.
          </p>
          
          {!modalOpen && (
            <Button 
              onClick={() => setModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Ver mi recibo
            </Button>
          )}
        </div>
      </div>

      {recibo && (
        <TicketModal
          open={modalOpen}
          onClose={handleCloseModal}
          productos={recibo.productos}
          total={recibo.total}
          fecha={recibo.fecha}
          hora={recibo.hora}
          cliente={recibo.cliente || recibo.id_user}
          ticketId={recibo.ticketId || recibo.ticket_id}
          metodoPago={recibo.metodo_pago || recibo.metodoPago}
        />
      )}
    </>
  );
}
/*"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { TicketModal } from "@/components/cart/Tickets";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

export default function SuccessPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [recibo, setRecibo] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!sessionId) {
      setError("No se recibió ID de sesión. Intente nuevamente.");
      setLoading(false);
      return;
    }

    const fetchReciboConReintentos = async () => {
      const maxIntentos = 10;
      const delay = 2000; // 2 segundos entre intentos

      const intentar = async () => {
        console.log(`Intento #${intentos + 1} de buscar recibo para sesión: ${sessionId}`);
        
        // Primero intentamos con stripe_session_id
        let { data, error } = await supabase
          .from("recibos")
          .select("*")
          .eq("stripe_session_id", sessionId)
          .single();
        
        // Si no se encuentra, intentamos con stripe_session
        if (!data && !error) {
          console.log("No se encontró con stripe_session_id, intentando con stripe_session");
          ({ data, error } = await supabase
            .from("recibos")
            .select("*")
            .eq("stripe_session", sessionId)
            .single());
        }

        if (data) {
          console.log("¡Recibo encontrado!", data);
          setRecibo(data);
          setModalOpen(true);
          setLoading(false);
        } else if (intentos < maxIntentos) {
          console.log(`Recibo no encontrado. Reintentando en ${delay}ms...`, error);
          setTimeout(() => {
            setIntentos((prev) => prev + 1);
          }, delay);
        } else {
          console.error("Recibo no encontrado después de varios intentos:", error);
          setError("No pudimos encontrar tu recibo. Por favor contacta a soporte con este ID: " + sessionId);
          setLoading(false);
        }
      };

      intentar();
    };

    fetchReciboConReintentos();
  }, [sessionId, intentos, supabase]);

  const handleCloseModal = () => {
    setModalOpen(false);
    // Redirigir al usuario a la página principal después de cerrar el modal
    setTimeout(() => router.push("/"), 500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-center mb-2">
          Procesando tu pago...
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          Estamos confirmando tu transacción. Esto puede tardar unos segundos.
          (Intento {intentos + 1}/10)
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-center mb-4 text-red-700">
            Hubo un problema
          </h2>
          <p className="text-center mb-6 text-gray-700">{error}</p>
          <div className="flex justify-center">
            <Button onClick={() => router.push("/")}>
              Volver a la tienda
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-700 mb-2">¡Gracias por tu compra!</h1>
          <p className="text-gray-700 mb-6">
            Tu pago ha sido procesado correctamente. Puedes ver los detalles de tu compra en el recibo.
          </p>
          
          {!modalOpen && (
            <Button 
              onClick={() => setModalOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Ver mi recibo
            </Button>
          )}
        </div>
      </div>

      {recibo && (
        <TicketModal
          open={modalOpen}
          onClose={handleCloseModal}
          productos={recibo.productos}
          total={recibo.total}
          fecha={recibo.fecha}
          hora={recibo.hora}
          cliente={recibo.cliente || recibo.id_user}
          ticketId={recibo.ticketId || recibo.ticket_id}
          metodoPago={recibo.metodo_pago || recibo.metodoPago}
        />
      )}
    </>
  );
}*/