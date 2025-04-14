// lib/supabase.js

import { createClient } from "@supabase/supabase-js";

// Usa tus credenciales de Supabase
const supabaseUrl = "https://tplkyyoiwcvncjeampep.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwbGt5eW9pd2N2bmNqZWFtcGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NTY2MDcsImV4cCI6MjA1NTUzMjYwN30.gEYXGQ7AOq-wpgL31ixFpxU6xlzzRJikjcDpuj8mL2c";

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });