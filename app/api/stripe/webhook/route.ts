// app/api/stripe/webhook/route.ts - VERSIÓN COMPLETAMENTE REVISADA
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// Configuración para webhook
export const config = {
  api: {
    bodyParser: false,
  },
};

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

// Inicializar Supabase con service role para asegurar permisos
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Función para leer el cuerpo de la solicitud como buffer
async function rawBody(req: NextRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const reader = req.body?.getReader();
  
  if (!reader) {
    throw new Error("No se pudo leer el body de la solicitud");
  }
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    
    return Buffer.concat(chunks);
  } catch (e) {
    console.error("Error leyendo el body:", e);
    throw e;
  }
}

export async function POST(req: NextRequest) {
  console.log("🔔 Webhook de Stripe recibido");
  
  try {
    // Leer el body como buffer para la verificación de firma
    const payload = await rawBody(req);
    
    // Obtener la firma de Stripe
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("❌ Webhook sin firma de Stripe");
      return NextResponse.json(
        { error: "Falta la firma del webhook" },
        { status: 400 }
      );
    }
    
    // Verificar la firma del evento
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log(`✅ Evento de Stripe verificado: ${event.type}`);
    } catch (err) {
      console.error(`❌ Error verificando webhook: ${err}`);
      return NextResponse.json(
        { error: `Error de verificación: ${err}` },
        { status: 400 }
      );
    }
    
    // Manejar el evento de checkout completado
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`💰 Checkout completado - Session ID: ${session.id}`);
      
      try {
        // Generar datos del recibo
        const ticketId = uuidv4();
        
        // Procesar productos desde metadata
        let productos = [];
        if (session.metadata?.productos) {
          try {
            productos = JSON.parse(session.metadata.productos);
            console.log("✅ Productos parseados correctamente:", productos);
          } catch (e) {
            console.error("❌ Error parseando productos:", e);
            // En caso de error, intentamos usar un arreglo vacío
          }
        } else {
          console.warn("⚠️ No se encontraron productos en metadata");
        }
        
        // Datos para guardar en Supabase
        const reciboData = {
          stripe_session_id: session.id,
          ticketId,
          total: session.amount_total ? session.amount_total / 100 : 0,
          productos,
          fecha: new Date().toISOString().split("T")[0],
          hora: new Date().toTimeString().split(" ")[0],
          cliente: session.customer_email || "Cliente",
          metodo_pago: session.payment_method_types?.[0] || "Tarjeta",
          created_at: new Date().toISOString(),
        };
        
        console.log("📝 Intentando guardar recibo:", reciboData);
        
        // Insertar en Supabase con manejo de errores detallado
        const { data, error } = await supabase
          .from("recibos")
          .insert([reciboData])
          .select();
        
        if (error) {
          console.error("❌ Error guardando en Supabase:", error);
          
          // Intentar diagnóstico del error
          if (error.code === "23505") {
            console.error("Parece ser un error de duplicado");
          } else if (error.code === "42P01") {
            console.error("La tabla 'recibos' posiblemente no existe");
          } else if (error.code === "42703") {
            console.error("Alguna columna no existe en la tabla 'recibos'");
          }
          
          return NextResponse.json(
            { error: `Error guardando recibo: ${error.message}` },
            { status: 500 }
          );
        }
        
        console.log(`✅ Recibo guardado exitosamente. TicketID: ${ticketId}`);
        console.log("Datos guardados:", data);
        
        return NextResponse.json({ 
          success: true, 
          message: "Pago procesado exitosamente",
          ticketId
        });
        
      } catch (err) {
        console.error("❌ Error procesando el pago:", err);
        return NextResponse.json(
          { error: `Error interno: ${err}` },
          { status: 500 }
        );
      }
    }
    
    // Para otros tipos de eventos, solo confirmamos recepción
    return NextResponse.json({ received: true });
    
  } catch (err) {
    console.error("❌ Error general en webhook:", err);
    return NextResponse.json(
      { error: `Error interno del servidor: ${err}` },
      { status: 500 }
    );
  }
}
/*// app/api/stripe/webhook/route.ts
import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { buffer } from 'micro'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const rawBody = await req.arrayBuffer()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(Buffer.from(rawBody), sig!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('❌ Error verificando firma del webhook:', err)
    return new Response(`Webhook Error: ${err}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.user_id
    const total = session.amount_total ? session.amount_total / 100 : 0
    const metodo_pago = session.payment_method_types?.[0] || 'Desconocido'
    const ticketId = uuidv4()

    if (!userId) {
      console.error('❌ No se recibió user_id en metadata.')
      return new Response(JSON.stringify({ error: 'Falta user_id en metadata' }), { status: 400 })
    }

    const { data: cartItems, error: cartError } = await supabase
      .from('carritos')
      .select('*')
      .eq('user_id', userId)

    if (cartError || !cartItems || cartItems.length === 0) {
      console.error('❌ Error al obtener el carrito o está vacío:', cartError)
      return new Response(JSON.stringify({ error: 'Error al obtener el carrito o carrito vacío' }), { status: 500 })
    }

    const productosJSON = cartItems.map(item => ({
      producto_id: item.producto_id,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad,
      subtotal: item.precio * item.cantidad,
    }))

    const { error: reciboError } = await supabase.from('recibos').insert({
      id_user: userId,
      fecha: new Date().toISOString().slice(0, 10),
      hora: new Date().toISOString().slice(11, 19),
      total,
      status: 'pagado',
      metodo_pago,
      productos: productosJSON,
      ticket_id: ticketId,
      stripe_session: session.id,
    })

    if (reciboError) {
      console.error('❌ Error al insertar el recibo:', reciboError)
      return new Response(JSON.stringify({ error: 'No se pudo insertar el recibo' }), { status: 500 })
    }

    const { error: deleteError } = await supabase.from('carritos').delete().eq('user_id', userId)

    if (deleteError) {
      console.error('⚠️ Error al limpiar el carrito:', deleteError)
    }

    console.log('✅ Recibo generado correctamente con ticket_id:', ticketId)
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}*/