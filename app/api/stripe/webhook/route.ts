import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

// ⚠️ Usa las variables PRIVADAS (sin NEXT_PUBLIC)
const supabase = createClient(
  process.env.SUPABASE_URL!,
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
  } catch (err: any) {
    console.error("❌ Error verificando webhook:", err.message);
    return NextResponse.json({ error: "Firma inválida o cuerpo no legible" }, { status: 400 });
  }

  console.log(`📩 Evento recibido desde Stripe: ${event.type}`);

  // ✅ Procesar solo cuando el pago fue exitoso
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("🧾 Datos de la sesión:", {
      id: session.id,
      amount_total: session.amount_total,
      metadata: session.metadata,
      email: session.customer_email,
    });

    // Validación de metadata
    const userId = session.metadata?.user_id;
    if (!userId) {
      console.error("❌ No se proporcionó user_id en metadata");
      return NextResponse.json({ error: "No se proporcionó user_id" }, { status: 400 });
    }

    const ticket_id = session.metadata?.ticket_id || uuidv4();

    let productos = [];
    try {
      productos = session.metadata?.productos
        ? JSON.parse(session.metadata.productos)
        : [];
    } catch (err) {
      console.error("❌ Error parseando productos:", err);
    }

    // ✅ Estructura exacta para insertar en Supabase
    const reciboData = {
      id_user: userId,
      ticket_id,
      stripe_session_id: session.id,
      total: Number((session.amount_total || 0) / 100),
      productos, // Guarda como JSONB
      email: session.customer_email,
      fecha: new Date().toISOString(),
      metodo_pago: session.payment_method_types?.[0] || "card",
      status: "completed",
    };

    console.log("📦 Insertando recibo en Supabase:", reciboData);

    try {
      const { data, error } = await supabase
        .from("recibos")
        .insert([reciboData])
        .select()
        .single();

      if (error) {
        console.error("❌ Error insertando recibo:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("✅ Recibo creado exitosamente:", data);
      return NextResponse.json({ success: true, ticket_id });
    } catch (insertErr: any) {
      console.error("❌ Error inesperado al insertar:", insertErr);
      return NextResponse.json(
        { error: insertErr.message || "Error desconocido" },
        { status: 500 }
      );
    }
  }

  console.log(`⚠️ Evento ignorado: ${event.type}`);
  return NextResponse.json({ received: true });
}
