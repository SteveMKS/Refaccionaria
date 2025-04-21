import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionData = async () => {
      setLoading(true);

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

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
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

  const fetchUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("nombre, apellido, correo")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error obteniendo usuario:", error);
    } else {
      setUser({ ...data, id: userId });
    }
  };

  return { session, user, loading };
};

export default useAuth;
