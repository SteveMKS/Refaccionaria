import Stripe from "stripe";
import { supabase } from '@/lib/supabase-browser';
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

type Producto = {
  id_sku: string;
  name: string;
  price: number;
  quantity: number;
  imagen_principal?: string;
  descripcion?: string;
};

export async function POST(req: Request) {
  try {
    const { cart, user_id, email, total }: {
      cart: Producto[];
      user_id: string;
      email: string;
      total: number;
    } = await req.json();

    // Validaciones básicas
    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }
    if (!user_id) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-03-31.basil",
    });

    // 1. Crear ticket pendiente
    const ticketId = uuidv4();
    const now = new Date();
    const fecha = now.toISOString().split("T")[0];
    const hora = now.toTimeString().split(" ")[0];
    const metodoPago = "Tarjeta";

    console.log("Insert recibo:", {
      id_user: user_id,
      status: "pendiente",
      fecha,
      hora,
      total,
      metodo_pago: metodoPago,
      productos: cart,
      ticket_id: ticketId,
      stripe_session: null,
    });

    // Insertar recibo en supabase
    const { error: insertError } = await supabase.from("recibos").insert({
      id_user: user_id,
      status: "pendiente",
      fecha,
      hora,
      total,
      metodo_pago: metodoPago,
      productos: cart,
      ticket_id: ticketId,
      stripe_session: null,
    });

    if (insertError) {
      console.error("Error insertando recibo:", insertError);
      return NextResponse.json({ error: "Error al crear recibo" }, { status: 500 });
    }

    // Crear sesión Stripe con metadata ticketId
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: cart.map(item => ({
        price_data: {
          currency: "mxn",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100), // price en centavos
        },
        quantity: item.quantity,
      })),
      metadata: { ticket_id: ticketId },
      success_url: `${process.env.URL_FRONTEND}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL_FRONTEND}/cancel`,
    });

    // Actualizar recibo con stripe_session
    const { error: updateError } = await supabase
      .from("recibos")
      .update({ stripe_session: session.id })
      .eq("ticket_id", ticketId);

    if (updateError) {
      console.error("Error actualizando sesión Stripe:", updateError);
      return NextResponse.json({ error: "Error actualizando sesión Stripe" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Error en checkout POST:", error);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
