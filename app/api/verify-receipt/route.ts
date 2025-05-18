import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

// Inicializar Supabase - usamos service role para tener máximos permisos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export async function GET(request: NextRequest) {
  // Obtener el session_id de los parámetros de la URL
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  
  if (!sessionId) {
    return NextResponse.json({
      success: false,
      error: "No se proporcionó un session_id",
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
  
  console.log(`🔍 Verificando recibo para session_id: ${sessionId}`);
  
  try {
    // 1. Verificar si el recibo existe en Supabase
    const { data: reciboData, error: reciboError } = await supabase
      .from("recibos")
      .select("*")
      .or(`stripe_session_id.eq.${sessionId},stripe_session.eq.${sessionId}`)
      .maybeSingle();
    
    // 2. Verificar si podemos obtener información de la sesión desde Stripe
    let sessionData = null;
    let sessionError = null;
    
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      sessionData = {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total ? session.amount_total / 100 : 0,
        customer: session.customer,
        customer_email: session.customer_email,
        metadata: session.metadata,
        created: new Date(session.created * 1000).toISOString(),
      };
    } catch (err: any) {
      sessionError = {
        message: err.message || "Error desconocido de Stripe",
        type: err.type || "unknown",
      };
    }
    
    // 3. Si el recibo no existe pero la sesión es válida, intentar crearlo
    let creacionRecibo = null;
    let creacionError = null;
    
    if (!reciboData && sessionData && 
        sessionData.status === "complete" && 
        sessionData.payment_status === "paid" &&
        sessionData.metadata?.user_id) {
      
      console.log("🔄 Recibo no encontrado pero la sesión es válida. Intentando crear recibo...");
      
      try {
        // Verificar que el usuario existe
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("id", sessionData.metadata.user_id)
          .single();
          
        if (userData) {
          // Procesar productos desde metadata
          let productos = [];
          if (sessionData.metadata.productos) {
            try {
              productos = JSON.parse(sessionData.metadata.productos);
            } catch (e) {
              console.error("❌ Error parseando productos:", e);
              productos = [];
            }
          }
          
          // Crear el recibo
          const nuevoRecibo = {
            id_user: sessionData.metadata.user_id,
            ticket_id: sessionData.metadata.ticket_id || crypto.randomUUID(),
            stripe_session_id: sessionId,
            total: sessionData.amount_total,
            productos: productos,
            fecha: new Date().toISOString().split("T")[0],
            hora: new Date().toTimeString().split(" ")[0],
            metodo_pago: "Tarjeta",
            status: "completed"
          };
          
          const { data, error } = await supabase
            .from("recibos")
            .insert([nuevoRecibo])
            .select();
            
          if (error) {
            creacionError = error;
          } else {
            creacionRecibo = data[0];
            console.log("✅ Recibo creado exitosamente como fallback");
          }
        } else {
          creacionError = {
            message: "El usuario no existe en la base de datos",
            code: "USER_NOT_FOUND"
          };
        }
      } catch (err: any) {
        creacionError = {
          message: err.message || "Error desconocido al crear recibo",
          code: err.code || "UNKNOWN_ERROR"
        };
      }
    }
    
    // 4. Devolver toda la información recopilada
    return NextResponse.json({
      success: !!reciboData || !!creacionRecibo,
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      recibo: reciboData || creacionRecibo,
      recibo_encontrado: !!reciboData,
      recibo_creado: !!creacionRecibo,
      stripe_session: sessionData,
      errores: {
        recibo: reciboError,
        stripe: sessionError,
        creacion: creacionError
      }
    });
    
  } catch (err: any) {
    console.error("❌ Error inesperado verificando recibo:", err);
    return NextResponse.json({
      success: false,
      error: `Error verificando recibo: ${err.message || err}`,
      timestamp: new Date().toISOString(),
      session_id: sessionId
    }, { status: 500 });
  }
}