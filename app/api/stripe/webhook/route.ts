import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export const config = { api: { bodyParser: false } };

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
    // ✅ Compatible con Vercel / Next.js runtime
    const bodyBuffer = Buffer.from(await req.arrayBuffer());
    event = stripe.webhooks.constructEvent(bodyBuffer, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("❌ Error verificando webhook:", err.message);
    return NextResponse.json({ error: "Firma inválida o cuerpo no legible" }, { status: 400 });
  }

  console.log(`📩 Evento recibido desde Stripe: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("🧾 Datos de la sesión recibida:", {
      id: session.id,
      amount_total: session.amount_total,
      metadata: session.metadata,
    });

    const userId = session.metadata?.user_id;
    if (!userId) {
      console.error("❌ No se proporcionó user_id en metadata");
      return NextResponse.json({ error: "No se proporcionó user_id" }, { status: 400 });
    }

    const ticket_id = uuidv4();

    let productos = [];
    try {
      productos = session.metadata?.productos ? JSON.parse(session.metadata.productos) : [];
    } catch (err) {
      console.error("❌ Error parseando productos:", err);
    }

    const reciboData = {
      id_user: userId,
      ticket_id,
      stripe_session_id: session.id,
      total: Number((session.amount_total! / 100).toFixed(2)),
      productos,
      fecha: new Date().toISOString().split("T")[0],
      hora: new Date().toLocaleTimeString("en-US", { hour12: false }),
      metodo_pago: session.payment_method_types?.[0] || "Tarjeta",
      status: "completed",
    };

    console.log("📦 Intentando insertar recibo en Supabase:", reciboData);

    const { data, error } = await supabase.from("recibos").insert([reciboData]).select();

    if (error) {
      console.error("❌ Error insertando recibo en Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Recibo creado exitosamente con Ticket ID: ${ticket_id}`);
    return NextResponse.json({ success: true, ticket_id });
  }

  console.log(`⚠️ Evento ignorado: ${event.type}`);
  return NextResponse.json({ received: true });
}
