import Stripe from "stripe";
import { supabase } from '@/lib/supabase-browser';
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

type Producto = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imagen_principal?: string;
  descripcion?: string;
};

interface StripeError {
  message?: string;
  type?: string;
  stack?: string;
  statusCode?: number;
}

export async function POST(req: Request) {
  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
    }

    // Validar contenido del request
    if (!req.body) {
      return NextResponse.json({ error: "Cuerpo de la solicitud vacío" }, { status: 400 });
    }

    const { cart, user_id, email, total }: {
      cart: Producto[];
      user_id: string;
      email: string;
      total: number;
    } = await req.json();

    // Validaciones
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "Carrito vacío o formato inválido" }, { status: 400 });
    }
    
    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json({ error: "ID de usuario inválido" }, { status: 401 });
    }

    if (!total || isNaN(total) || total <= 0) {
      return NextResponse.json({ error: "Total inválido" }, { status: 400 });
    }

    // Validar productos
    for (const item of cart) {
      if (!item.id || !item.name || !item.price || !item.quantity) {
        return NextResponse.json(
          { error: `Producto inválido: ${JSON.stringify(item)}` }, 
          { status: 400 }
        );
      }
    }

    // Configuración de Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY no está definida');
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-03-31.basil",
    });

    // Crear ticket
    const ticketId = uuidv4();
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toTimeString().split(' ')[0];
    const metodoPago = "Tarjeta";

    // Configuración de URLs desde variables de entorno
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://refaccionaria.vercel.app';
    const REDIRECT_URL = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || SITE_URL;

    // Insertar recibo en Supabase
    const { data: reciboData, error: insertError } = await supabase
      .from("recibos")
      .insert({
        id_user: user_id,
        status: "pendiente",
        fecha,
        hora,
        total,
        metodo_pago: metodoPago,
        productos: cart,
        ticket_id: ticketId,
        stripe_session: null,
      })
      .select();

    if (insertError) {
      console.error("Error insertando recibo:", insertError);
      return NextResponse.json(
        { error: "Error al crear recibo", details: insertError.message }, 
        { status: 500 }
      );
    }

    // Crear sesión de Stripe
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: email,
        line_items: cart.map(item => ({
          price_data: {
            currency: "mxn",
            product_data: { 
              name: item.name,
              description: item.descripcion || undefined,
              images: item.imagen_principal ? [item.imagen_principal] : undefined,
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        metadata: { 
          ticket_id: ticketId,
          user_id: user_id,
        },
        success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/cancel`,
      });

      // Actualizar recibo con session ID
      const { error: updateError } = await supabase
        .from("recibos")
        .update({ stripe_session: session.id })
        .eq("ticket_id", ticketId);

      if (updateError) {
        console.error("Error actualizando sesión Stripe:", updateError);
      }

      return NextResponse.json({ url: session.url });

    } catch (error: unknown) {
      console.error("Error en Stripe:", error);
      
      // Actualizar estado del recibo a fallido
      await supabase
        .from("recibos")
        .update({ status: "fallido" })
        .eq("ticket_id", ticketId);

      // Manejo seguro del error
      let errorMessage = "Error al crear sesión de pago";
      let errorDetails: string | undefined = undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorDetails = JSON.stringify(error, null, 2);
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails
        }, 
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error("Error en checkout POST:", error);
    
    let errorMessage = "Error inesperado";
    let errorDetails: string | undefined = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorDetails = JSON.stringify(error, null, 2);
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      }, 
      { status: 500 }
    );
  }
}