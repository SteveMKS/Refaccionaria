// app/api/stripe/create-checkout-session/route.ts - CORREGIDO
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

// Inicializar Supabase (opcional, por si necesitas verificar el usuario)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Extraer productos, email y userId del cuerpo de la solicitud
    const { productos, email, userId } = await req.json();
    
    // Verificar que tengamos el ID del usuario
    if (!userId) {
      console.error("❌ No se proporcionó el ID de usuario");
      return NextResponse.json(
        { error: "Se requiere el ID de usuario para procesar el pago" },
        { status: 400 }
      );
    }
    
    console.log(`📦 Creando sesión para usuario ${userId} con ${productos.length} productos`);

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: {
        productos: JSON.stringify(productos),
        user_id: userId // Crucial: Incluimos el ID del usuario aquí
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
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/Payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/Payments/cancel`,
    });

    console.log(`✅ Sesión de Stripe creada con éxito - ID: ${session.id}`);
    return NextResponse.json({ url: session.url });
    
  } catch (err: any) {
    console.error("❌ Error creando sesión de Stripe:", err.message);
    return NextResponse.json(
      { error: "Error al crear sesión de pago" },
      { status: 500 }
    );
  }
}