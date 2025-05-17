// pages/api/stripe/webhook.ts
import Stripe from "stripe";
import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log(`✅ Evento verificado: ${event.type}`);
  } catch (err) {
    console.error("⚠️ Error verificando la firma:", err);
    return res.status(400).send("Webhook error: Firma inválida");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Asegúrate de que metadata y user_id existen
    const metadata = session.metadata;
    if (!metadata || !metadata.user_id) {
      return res.status(400).json({ error: "Falta user_id en metadata" });
    }

    let productos = [];
    try {
      productos = metadata.productos ? JSON.parse(metadata.productos) : [];
    } catch (e) {
      console.error("❌ Error al parsear productos:", e);
    }

    const ticket_id = uuidv4();

    const reciboData = {
      id_user: metadata.user_id,
      ticket_id,
      stripe_session_id: session.id,
      total: session.amount_total ? session.amount_total / 100 : 0,
      productos,
      fecha: new Date().toISOString().split("T")[0],
      hora: new Date().toTimeString().split(" ")[0],
      metodo_pago: session.payment_method_types?.[0] || "Tarjeta",
      status: "completed",
    };

    const { error } = await supabase.from("recibos").insert([reciboData]);

    if (error) {
      console.error("❌ Error al guardar en Supabase:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("✅ Recibo guardado correctamente:", ticket_id);
    return res.status(200).json({ success: true, ticket_id });
  }

  return res.status(200).json({ received: true });
}

/*// app/api/stripe/webhook/route.ts - CORREGIDO
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
        // Verificar si existe un customer ID en los metadatos
        const userId = session.metadata?.user_id;
        if (!userId) {
          console.error("❌ No se encontró user_id en los metadatos de la sesión");
          return NextResponse.json(
            { error: "Se requiere id_user pero no se proporcionó en los metadatos" },
            { status: 400 }
          );
        }
        
        // Generar ticket_id
        const ticket_id = uuidv4();
        
        // Procesar productos desde metadata
        let productos = [];
        if (session.metadata?.productos) {
          try {
            productos = JSON.parse(session.metadata.productos);
            console.log("✅ Productos parseados correctamente:", productos);
          } catch (e) {
            console.error("❌ Error parseando productos:", e);
            productos = []; // En caso de error, usamos un arreglo vacío
          }
        } else {
          console.warn("⚠️ No se encontraron productos en metadata");
        }
        
        // Datos para guardar en Supabase - adaptados a la estructura de la tabla
        const reciboData = {
          id_user: userId,
          ticket_id,
          stripe_session_id: session.id,
          total: session.amount_total ? session.amount_total / 100 : 0,
          productos,
          fecha: new Date().toISOString().split("T")[0],
          hora: new Date().toTimeString().split(" ")[0],
          metodo_pago: session.payment_method_types?.[0] || "Tarjeta",
          status: "completed",
          // Los campos creado_en y actualizado_en tienen valores por defecto en la DB
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
          } else if (error.code === "23502") {
            console.error("Violación de restricción NOT NULL");
          }
          
          return NextResponse.json(
            { error: `Error guardando recibo: ${error.message}` },
            { status: 500 }
          );
        }
        
        console.log(`✅ Recibo guardado exitosamente. Ticket ID: ${ticket_id}`);
        console.log("Datos guardados:", data);
        
        return NextResponse.json({ 
          success: true, 
          message: "Pago procesado exitosamente",
          ticket_id
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
}*/