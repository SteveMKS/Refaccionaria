import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tplkyyoiwcvncjeampep.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Recortado por seguridad

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
});
