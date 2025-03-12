import { supabase } from "@/lib/supabase";

export async function registrarLogin(userId: string) {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();

    const ip = data.ip || "IP no disponible";

    const { error } = await supabase
      .from("login")
      .insert({
        id_usuario: userId,
        ip: ip
      });

    if (error) {
      console.error("Error al registrar el inicio de sesión:", error.message);
    }
  } catch (error) {
    console.error("Error al obtener la IP:", error);
  }
}
