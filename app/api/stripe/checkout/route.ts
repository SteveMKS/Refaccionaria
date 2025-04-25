import { NextResponse } from "next/server";
import Stripe from "stripe";

interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2022-11-15", // ✅ versión estable
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.cartItems || !Array.isArray(body.cartItems)) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const line_items = body.cartItems.map((item: CartItem) => {
      if (!item.name || typeof item.price !== "number" || typeof item.quantity !== "number" || item.price <= 0) {
        throw new Error("Datos del producto inválidos");
      }

      return {
        price_data: {
          currency: "mxn",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const siteURL = process.env.NEXT_PUBLIC_SITE_URL ?? req.headers.get("origin");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${siteURL}/Payments/success`,
      cancel_url: `${siteURL}/Payments/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Stripe Checkout error:", err.message);
    } else {
      console.error("Stripe Checkout error:", err);
    }

    return NextResponse.json({ error: "Error al crear sesión de pago con Stripe" }, { status: 500 });
  }
}
