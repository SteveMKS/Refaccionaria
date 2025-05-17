import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// 🔧 Requerido para desactivar el body parser y leer el raw body
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

// 🧠 Función para leer todo el body como Buffer desde el ReadableStream
async function readRequestBodyAsBuffer(request: NextRequest): Promise<Buffer> {
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];

  if (!reader) throw new Error("No body stream found.");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  let bodyBuffer: Buffer;
  let event: Stripe.Event;

  try {
    bodyBuffer = await readRequestBodyAsBuffer(req);
  } catch (error) {
    console.error("Error al leer el cuerpo de la solicitud:", error);
    return NextResponse.json({ error: "Error al leer body" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Falta firma de Stripe" }, { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(
      bodyBuffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("⚠️ Verificación de firma fallida:", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const ticketId = uuidv4();

    const { error } = await supabase.from("recibos").insert([
      {
        stripe_session_id: session.id,
        ticketId,
        total: session.amount_total! / 100,
        productos: session.metadata?.productos
          ? JSON.parse(session.metadata.productos)
          : [],
        fecha: new Date().toISOString().split("T")[0],
        hora: new Date().toLocaleTimeString(),
        cliente: session.customer_email || "Anónimo",
        metodo_pago: session.payment_method_types?.[0] || "Desconocido",
      },
    ]);

    if (error) {
      console.error("❌ Error al guardar en Supabase:", error);
      return NextResponse.json({ error: "Supabase insert error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
