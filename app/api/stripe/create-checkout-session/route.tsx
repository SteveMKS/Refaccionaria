// app/api/stripe/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(req: Request) {
  try {
    const { productos, email } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: {
        productos: JSON.stringify(productos),
      },
      line_items: productos.map((p: any) => ({
        price_data: {
          currency: "mxn",
          product_data: {
            name: p.nombre,
          },
          unit_amount: Math.round(p.precio * 100),
        },
        quantity: p.cantidad,
      })),
      customer_email: email,
      // Modificamos las URLs de éxito y cancelación para incluir el session_id
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/Payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/Payments/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Error creando sesión de Stripe:", err);
    return NextResponse.json({ error: "Error al crear sesión" }, { status: 500 });
  }
}