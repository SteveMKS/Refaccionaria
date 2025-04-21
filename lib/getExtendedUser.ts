import { supabase } from "@/lib/supabase-browser"; // Ajusta si tu path es distinto

export const getExtendedUser = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    console.warn("No hay sesión activa");
    return null;
  }

  const userId = session.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Error al obtener perfil extendido:", profileError);
    return null;
  }

  return {
    ...session.user,
    ...profile
  };
};
