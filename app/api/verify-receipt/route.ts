import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializar Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const sessionId = searchParams.get("session_id");
  
  if (!sessionId) {
    return NextResponse.json(
      { error: "Se requiere session_id" },
      { status: 400 }
    );
  }
  
  try {
    console.log(`🔍 Verificando recibo para session_id: ${sessionId}`);
    
    // Intenta encontrar el recibo usando stripe_session_id
    let { data: reciboBySessionId, error: errorSessionId } = await supabase
      .from("recibos")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .single();
      
    if (reciboBySessionId) {
      console.log("✅ Recibo encontrado por stripe_session_id");
      return NextResponse.json({
        found: true,
        searchMethod: "stripe_session_id",
        recibo: reciboBySessionId
      });
    }
    
    // Si no, intenta con stripe_session
    let { data: reciboBySession, error: errorSession } = await supabase
      .from("recibos")
      .select("*")
      .eq("stripe_session", sessionId)
      .single();
      
    if (reciboBySession) {
      console.log("✅ Recibo encontrado por stripe_session");
      return NextResponse.json({
        found: true,
        searchMethod: "stripe_session",
        recibo: reciboBySession
      });
    }
    
    // Verificar si el webhook ha sido procesado
    const { data: webhookEvent, error: webhookError } = await supabase
      .from("stripe_events")
      .select("*")
      .eq("source_id", sessionId)
      .single();
      
    if (webhookEvent) {
      return NextResponse.json({
        found: false,
        webhookProcessed: true,
        webhookEvent,
        message: "El webhook fue procesado pero no se creó recibo"
      });
    }
    
    // No se encontró nada
    console.log("❌ No se encontró recibo para este session_id");
    return NextResponse.json({
      found: false,
      errorSessionId,
      errorSession,
      webhookError,
      message: "No se encontró recibo para este ID de sesión"
    });
    
  } catch (error) {
    console.error("❌ Error verificando recibo:", error);
    return NextResponse.json(
      { error: `Error verificando recibo: ${error}` },
      { status: 500 }
    );
  }
}