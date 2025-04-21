import { supabase } from '@/lib/supabase-browser';

export async function registrarLogin(userId: string) {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();

    const ip = data.ip || "IP no disponible";

    const { error } = await supabase
      .from("login")
      .insert({
        user_id: userId,
        ip: ip
      });

    if (error) {
      console.error("Error al registrar el inicio de sesión:", error.message);
    }
  } catch (error) {
    console.error("Error al obtener la IP:", error);
  }
}
