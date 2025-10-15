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

async function readRequestBodyAsBuffer(request: NextRequest): Promise<Buffer> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("No body stream found.");
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Falta firma de Stripe" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const bodyBuffer = await readRequestBodyAsBuffer(req);
    event = stripe.webhooks.constructEvent(bodyBuffer, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Error verificando webhook:", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    if (!userId) return NextResponse.json({ error: "No se proporcionó user_id" }, { status: 400 });

    const ticket_id = uuidv4();

    let productos = [];
    if (session.metadata?.productos) {
      try { productos = JSON.parse(session.metadata.productos); } 
      catch { productos = []; }
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

    const { data, error } = await supabase.from("recibos").insert([reciboData]).select();

    if (error) {
      console.error("Error insertando recibo:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Recibo creado exitosamente: Ticket ID ${ticket_id}`);
    return NextResponse.json({ success: true, ticket_id });
  }

  return NextResponse.json({ received: true });
}
