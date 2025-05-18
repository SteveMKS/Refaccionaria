import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Definimos tipos para mejorar la seguridad de tipos
type Recibo = any; // Puedes definir un tipo más específico según tu estructura de datos

export default function useVerificarPago() {
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intentos, setIntentos] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Obtener el session_id de la URL
  const sessionId = searchParams.get("session_id");
  
  useEffect(() => {
    // Si no hay session_id, no continuar
    if (!sessionId) {
      setLoading(false);
      setError("No se proporcionó un ID de sesión");
      return;
    }
    
    // Función para verificar el pago
    const verificarPago = async () => {
      try {
        setIntentos(prev => prev + 1);
        console.log(`Intento #${intentos + 1} de buscar recibo para sesión: ${sessionId}`);
        
        const respuesta = await fetch(`/api/recibos/get?session_id=${sessionId}`);
        const datos = await respuesta.json();
        
        if (!respuesta.ok) {
          console.error("Error verificando pago:", datos.error);
          
          // Si aún no hemos alcanzado el máximo de intentos, programar otro intento
          if (intentos < 5) {
            console.log(`Recibo no encontrado. Reintentando en 2000ms...`, datos);
            setTimeout(verificarPago, 2000);
            return;
          }
          
          setError(datos.error || "No se pudo verificar el pago");
          setLoading(false);
          return;
        }
        
        // Éxito - recibo encontrado
        console.log("✅ Recibo encontrado:", datos.recibo);
        setRecibo(datos.recibo);
        setLoading(false);
      } catch (err) {
        console.error("Error al verificar pago:", err);
        
        // Si aún no hemos alcanzado el máximo de intentos, programar otro intento
        if (intentos < 5) {
          console.log(`Error al verificar pago. Reintentando en 2000ms...`);
          setTimeout(verificarPago, 2000);
          return;
        }
        
        setError("Error inesperado al verificar el pago");
        setLoading(false);
      }
    };
    
    // Iniciar la verificación del pago
    verificarPago();
  }, [sessionId, intentos]); // Añadido 'intentos' como dependencia
  
  return { recibo, loading, error, intentos };
}