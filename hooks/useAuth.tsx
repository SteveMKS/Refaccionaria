import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase-browser';

const useAuth = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionData = async () => {
      setLoading(true);

      // 🔹 Obtiene la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    getSessionData();

    // 🔹 Escuchar cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  // 🔹 Función para obtener los datos del usuario desde la BD
  const fetchUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from("users") // Asegúrate de que esta es la tabla correcta
      .select("nombre, apellido, correo") // Selecciona solo lo necesario
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error obteniendo usuario:", error);
    } else {
      setUser({ ...data, id: userId }); // 🔹 Fusionamos el ID con los datos obtenidos
    }
  };

  return { session, user, loading };
};

export default useAuth;
