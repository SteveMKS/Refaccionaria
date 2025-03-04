import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // Ruta de tu cliente Supabase

const useAuth = () => {
  const [session, setSession] = useState<any>();
  const [user, setUser] = useState<any>();

  useEffect(() => {
    // Obtiene la sesión actual desde Supabase (esto lee la cookie de la sesión)
    const getSessionData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null); // Aquí se maneja el caso de que session sea null
    };

    getSessionData();

    // Escucha los cambios de sesión
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user || null); // Aquí también se verifica si session es null
      }
    );

    // Limpiar suscripción al desmontar el componente
    return () => {
      if (authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return { session, user };
};

export default useAuth;
