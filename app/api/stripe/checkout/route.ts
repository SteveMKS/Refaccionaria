import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buffer } from "node:stream/consumers";
import { v4 as uuidv4 } from "uuid";

// ⚠️ Next.js requiere esta configuración para recibir el raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const rawBody = await req.body?.getReader().read();
  const bodyBuffer = rawBody?.value;
  if (!bodyBuffer) return NextResponse.json({ error: "Empty body" }, { status: 400 });

  const sig = req.headers.get("stripe-signature")!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(bodyBuffer),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("⚠️  Webhook signature verification failed.", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const ticketId = uuidv4();

    const { error } = await supabase.from("recibos").insert([
      {
        stripe_session_id: session.id,
        ticketId,
        total: session.amount_total! / 100,
        productos: session.metadata?.productos ? JSON.parse(session.metadata.productos) : [],
        fecha: new Date().toISOString().split("T")[0],
        hora: new Date().toLocaleTimeString(),
        cliente: session.customer_email || "Anónimo",
        metodo_pago: session.payment_method_types[0],
      },
    ]);

    if (error) {
      console.error("Error al guardar en Supabase:", error);
      return NextResponse.json({ error: "Supabase insert error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
