import { supabase } from "@/lib/supabase"; // Asegúrate de que la instancia de Supabase esté correctamente importada

export async function registrarLogin(userId: string, req: any) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const { error } = await supabase
    .from('login') // Nombre de tu tabla para registrar los logins
    .insert({
      user_id: userId,
      ip: ip || 'IP no disponible'  // En caso de que no se detecte la IP
    });

  if (error) {
    console.error("Error al registrar el inicio de sesión:", error.message);
  }
}