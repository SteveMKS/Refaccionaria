// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, cart: metadataCart } = session.metadata || {};

    if (!userId || !metadataCart) {
      return new NextResponse("Datos incompletos en metadata", { status: 400 });
    }

    try {
      const cartItems = JSON.parse(metadataCart);
      const now = new Date();
      const fecha = now.toISOString().split("T")[0];
      const hora = now.toTimeString().split(" ")[0];
      const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      // 1. Actualizar existencias de productos
      for (const item of cartItems) {
        await supabase.rpc("descontar_existencias", {
          sku: item.id_sku,
          cantidad: item.quantity
        });
      }

      // 2. Crear recibo en Supabase
      const { data: ticket, error } = await supabase
        .from("recibos")
        .insert({
          id_user: userId,
          fecha,
          hora,
          total,
          status: "pagado",
          metodo_pago: "tarjeta",
          productos: cartItems,
          ticket_id: session.id,
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Vaciar carrito del usuario
      await supabase
        .from("carritos")
        .delete()
        .eq("user_id", userId);

      return NextResponse.json({ success: true, ticket });

    } catch (error: any) {
      console.error("Error en webhook:", error.message);
      return new NextResponse("Error interno", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}