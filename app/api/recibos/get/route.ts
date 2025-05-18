
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  // Obtener el session_id de los parámetros de la URL
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  
  if (!sessionId) {
    return NextResponse.json({
      success: false,
      error: "No se proporcionó un session_id"
    }, { status: 400 });
  }
  
  console.log(`🔍 Buscando recibo para session_id: ${sessionId}`);
  
  try {
    // Intentar obtener el recibo
    const { data, error } = await supabase
      .from("recibos")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .maybeSingle(); // Usamos maybeSingle en lugar de single para evitar errores si no hay resultados
    
    if (error) {
      console.error("❌ Error al consultar Supabase:", error);
      return NextResponse.json({
        success: false,
        error: `Error de base de datos: ${error.message}`
      }, { status: 500 });
    }
    
    if (!data) {
      console.log("⚠️ No se encontró recibo para esta sesión");
      return NextResponse.json({
        success: false,
        error: "No se encontró ningún recibo para esta sesión",
        session_id: sessionId
      }, { status: 404 });
    }
    
    console.log(`✅ Recibo encontrado: ${data.ticket_id}`);
    return NextResponse.json({
      success: true,
      recibo: data
    });
  } catch (err: any) {
    console.error("❌ Error inesperado:", err);
    return NextResponse.json({
      success: false,
      error: `Error inesperado: ${err.message || err}`
    }, { status: 500 });
  }
}