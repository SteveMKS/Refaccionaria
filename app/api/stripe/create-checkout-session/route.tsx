import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { productos, email, userId, ticket_id } = await req.json();

    if (!userId) {
      console.error("❌ No se proporcionó el ID de usuario");
      return NextResponse.json(
        { error: "Se requiere el ID de usuario para procesar el pago" },
        { status: 400 }
      );
    }

    console.log(`📦 Creando sesión para usuario ${userId} con ${productos.length} productos`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: {
        productos: JSON.stringify(productos), // ya con keys correctas
        user_id: userId,
        ticket_id: ticket_id || undefined,
      },
      line_items: productos.map((p: any) => ({
        price_data: {
          currency: "mxn",
          product_data: {
            name: p.name,
          },
          unit_amount: Math.round(p.price * 100), // ✅ Esto necesita que `p.price` sea número
        },
        quantity: p.quantity,
      })),
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/Payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/Payments/cancel`,
    });

    console.log(`✅ Sesión de Stripe creada con éxito - ID: ${session.id}`);
    return NextResponse.json({ url: session.url, sessionId: session.id });

  } catch (err: any) {
    console.error("❌ Error creando sesión de Stripe:", err.message);
    return NextResponse.json(
      { error: "Error al crear sesión de pago" },
      { status: 500 }
    );
  }
}
