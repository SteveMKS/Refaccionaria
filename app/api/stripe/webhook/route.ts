import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: { bodyParser: false },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function readRequestBodyAsBuffer(req: NextRequest): Promise<Buffer> {
  const reader = req.body?.getReader();
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
  console.log("🔔 Webhook recibido -", new Date().toISOString());

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("❌ Stripe no configurado");
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 500 });
  }

  let bodyBuffer: Buffer;
  let event: Stripe.Event;

  try {
    bodyBuffer = await readRequestBodyAsBuffer(req);
    console.log("✅ Body leído. Longitud:", bodyBuffer.length);
  } catch (err) {
    console.error("❌ Error leyendo body:", err);
    return NextResponse.json({ error: "Error leyendo body" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Falta firma Stripe" }, { status: 400 });

  try {
    event = stripe.webhooks.constructEvent(
      bodyBuffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Evento Stripe:", event.type);
  } catch (err) {
    console.error("❌ Firma inválida:", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const productos = session.metadata?.productos ? JSON.parse(session.metadata.productos) : [];
    const ticket_id = uuidv4();

    if (!userId) {
      console.error("❌ user_id no encontrado en metadata");
      return NextResponse.json({ error: "No hay user_id en metadata" }, { status: 400 });
    }

    // Verificamos si el usuario existe
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("❌ Usuario no existe:", userError);
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 400 });
    }

    // Preparamos recibo
    const reciboData = {
      id_user: userId,
      ticket_id,
      stripe_session_id: session.id,
      total: Number((session.amount_total! / 100).toFixed(2)),
      productos: productos,
      fecha: new Date().toISOString().split("T")[0],
      hora: new Date().toLocaleTimeString("en-US", { hour12: false }),
      metodo_pago: session.payment_method_types?.[0] || "Tarjeta",
      status: "completed",
    };

    console.log("📝 Datos a insertar:", reciboData);
    console.log("🔍 Tipos de datos:");
    Object.entries(reciboData).forEach(([key, value]) => console.log(`${key}:`, typeof value));

    // Intento de insert con log de error completo
    const { data, error } = await supabase
      .from("recibos")
      .insert([reciboData])
      .select();

    if (error) {
      console.error("❌ Error al guardar recibo en Supabase:", error);
      console.log("Detalles del error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json({ error: "No se pudo crear recibo", debug: error }, { status: 500 });
    }

    console.log("✅ Recibo creado exitosamente:", data);
    return NextResponse.json({ success: true, ticket_id, recibo: data });
  }

  return NextResponse.json({ received: true });
}
