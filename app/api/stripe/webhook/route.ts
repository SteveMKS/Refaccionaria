import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  
  if (!sig) {
    console.error("❌ Falta firma de Stripe");
    return NextResponse.json({ error: "Falta firma de Stripe" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const bodyBuffer = Buffer.from(await req.arrayBuffer());
    event = stripe.webhooks.constructEvent(
      bodyBuffer, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log("✅ Evento verificado correctamente");
  } catch (err: any) {
    console.error("❌ Error verificando webhook:", err.message);
    return NextResponse.json(
      { error: "Firma inválida", details: err.message }, 
      { status: 400 }
    );
  }

  console.log(`📩 Evento recibido: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("🧾 Session ID:", session.id);
    console.log("💰 Amount:", session.amount_total);
    console.log("📦 Metadata:", session.metadata);

    const userId = session.metadata?.user_id;
    
    if (!userId) {
      console.error("❌ No se proporcionó user_id en metadata");
      return NextResponse.json({ error: "No se proporcionó user_id" }, { status: 400 });
    }

    // 🔥 Verificar que el usuario existe en la base de datos
    const { data: userExists, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !userExists) {
      console.error("❌ Usuario no encontrado en la base de datos:", userId);
      return NextResponse.json(
        { error: "Usuario no encontrado", userId }, 
        { status: 400 }
      );
    }

    console.log("✅ Usuario validado:", userId);

    // 🔥 Generar UUID válido para ticket_id
    const ticket_id = uuidv4();

    // 🔥 Parsear productos como objeto JSON (no string)
    let productos = [];
    try {
      productos = session.metadata?.productos 
        ? JSON.parse(session.metadata.productos) 
        : [];
      console.log("✅ Productos parseados:", productos);
    } catch (err) {
      console.error("❌ Error parseando productos:", err);
      productos = [];
    }

    const ahora = new Date();

    // 🔥 Estructura exacta según tu tabla
    const reciboData = {
      id_user: userId, // UUID (string compatible)
      ticket_id, // UUID generado
      stripe_session_id: session.id, // text
      total: Number((session.amount_total! / 100).toFixed(2)), // numeric(10,2)
      productos, // jsonb (objeto, NO string)
      fecha: ahora.toISOString().split("T")[0], // date (YYYY-MM-DD)
      hora: ahora.toTimeString().split(" ")[0], // time (HH:MM:SS)
      metodo_pago: session.payment_method_types?.[0] || "card", // varchar(50)
      status: "completed", // text
      // id_recibo: se genera automáticamente con gen_random_uuid()
      // creado_en: se genera automáticamente con now()
      // actualizado_en: se genera automáticamente con now()
    };

    console.log("📦 Datos a insertar:");
    console.log(JSON.stringify(reciboData, null, 2));

    try {
      const { data, error } = await supabase
        .from("recibos")
        .insert([reciboData])
        .select();

      if (error) {
        console.error("❌ Error de Supabase:");
        console.error("  - Message:", error.message);
        console.error("  - Details:", error.details);
        console.error("  - Hint:", error.hint);
        console.error("  - Code:", error.code);
        
        return NextResponse.json(
          { 
            error: "Error insertando recibo",
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          }, 
          { status: 500 }
        );
      }

      console.log("✅✅✅ Recibo creado exitosamente!");
      console.log("Ticket ID:", ticket_id);
      console.log("Data insertada:", data);
      
      return NextResponse.json({ 
        success: true, 
        ticket_id,
        recibo: data[0]
      });
      
    } catch (err: any) {
      console.error("❌ Error inesperado:", err);
      return NextResponse.json(
        { error: "Error inesperado", message: err.message }, 
        { status: 500 }
      );
    }
  }

  console.log(`⚠️ Evento no manejado: ${event.type}`);
  return NextResponse.json({ received: true });
}
