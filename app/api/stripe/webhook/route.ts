import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const buf = await req.arrayBuffer();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig, endpointSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Obtener recibo relacionado
    const { data: recibo, error: reciboError } = await supabase
      .from("recibos")
      .select("*")
      .eq("ticket_id", session.id)
      .single();

    if (reciboError || !recibo) {
      console.error("Recibo no encontrado para ticket:", session.id);
      return NextResponse.json({ error: "Recibo no encontrado" }, { status: 404 });
    }

    if (recibo.status === "pagado") {
      // Ya procesado previamente
      return NextResponse.json({ received: true });
    }

    const productosComprados = recibo.productos as {
      id_sku: string;
      quantity: number;
    }[];

    // Actualizar stock para cada producto
    for (const item of productosComprados) {
      const { data: productoActual, error: errorProducto } = await supabase
        .from("productos")
        .select("existencias")
        .eq("id_sku", item.id_sku)
        .single();

      if (errorProducto || !productoActual) {
        console.error("Producto no encontrado para stock:", item.id_sku);
        continue;
      }

      const nuevoStock = productoActual.existencias - item.quantity;

      if (nuevoStock < 0) {
        console.error("Stock insuficiente para:", item.id_sku);
        continue;
      }

      const { error: updateError } = await supabase
        .from("productos")
        .update({ existencias: nuevoStock })
        .eq("id_sku", item.id_sku);

      if (updateError) {
        console.error("Error actualizando stock para:", item.id_sku, updateError);
      }
    }

    // Actualizar estado del recibo a pagado
    const { error: updateReciboError } = await supabase
      .from("recibos")
      .update({ status: "pagado" })
      .eq("ticket_id", session.id);

    if (updateReciboError) {
      console.error("Error actualizando recibo a pagado:", updateReciboError);
    }
  }

  return NextResponse.json({ received: true });
}
