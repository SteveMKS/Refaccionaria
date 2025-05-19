import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";


// 🔧 Configuración para desactivar el body parser y leer el raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

console.log("📦 INICIO DE WEBHOOK CARGADO - Tiempo:", new Date().toISOString());

export const runtime = "nodejs"; // 👈 NECESARIO para Stripe

// Inicializar Stripe con formato de API específico
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

// Inicializar Supabase con service role para permisos elevados
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variables de entorno de Supabase no configuradas correctamente");
}

const supabase = createClient(supabaseUrl!, supabaseKey!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// 🧠 Función para leer todo el body como Buffer desde el ReadableStream
async function readRequestBodyAsBuffer(request: Request): Promise<Buffer> {
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];

  if (!reader) throw new Error("No body stream found.");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  console.log("🔔 Webhook de Stripe recibido - " + new Date().toISOString());
  
  // Verificar variables de entorno cruciales
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("❌ Variables de entorno de Stripe no configuradas");
    return NextResponse.json(
      { error: "Configuración del servidor incompleta" },
      { status: 500 }
    );
  }
  
  let bodyBuffer: Buffer;
  let event: Stripe.Event;

  // Paso 1: Leer el cuerpo de la solicitud
  try {
    bodyBuffer = await readRequestBodyAsBuffer(req);
    console.log("✅ Body leído correctamente, longitud:", bodyBuffer.length);
  } catch (error) {
    console.error("❌ Error al leer el cuerpo de la solicitud:", error);
    return NextResponse.json({ error: "Error al leer body" }, { status: 400 });
  }

  // Paso 2: Verificar la firma de Stripe
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("❌ Falta firma de Stripe en headers");
    return NextResponse.json({ error: "Falta firma de Stripe" }, { status: 400 });
  }

  console.log("🔐 Verificando firma con secret:", process.env.STRIPE_WEBHOOK_SECRET);

  try {
    event = stripe.webhooks.constructEvent(
      bodyBuffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log(`✅ Evento de Stripe verificado: ${event.type}`);
  } catch (err) {
    console.error("⚠️ Verificación de firma fallida:", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  console.log("🔐 Verificando firma con secret:", process.env.STRIPE_WEBHOOK_SECRET);


  // 👇 Inserción de prueba aislado (puedes dejarlo en producción temporalmente si quieres verlo funcionar)
console.log("⚙️ Ejecutando insert de prueba aislado...");

const pruebaInsert = await supabase.from("recibos").insert([
  {
    id_user: 'd46290e7-c522-4eca-b190-0759a3d84a2c', // ⚠️ Usa un ID que exista en tu tabla "users"
    ticket_id: 'debug-test-' + Math.random().toString(36).substring(2, 8),
    stripe_session_id: 'cs_test_debug_' + Date.now(),
    total: 123.45,
    productos: [
      { id: 'p1', name: 'Producto de prueba', price: 100, quantity: 1 },
      { id: 'p2', name: 'Producto 2', price: 23.45, quantity: 1 }
    ],
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0],
    metodo_pago: 'debug',
    status: 'completed'
  }
]).select();

if (pruebaInsert.error) {
  console.error("❌ Insert de prueba falló:", pruebaInsert.error.message, pruebaInsert.error.code, pruebaInsert.error.details);
} else {
  console.log("✅ Insert de prueba exitoso:", JSON.stringify(pruebaInsert.data, null, 2));
}

  // Paso 3: Procesar el evento checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(`💰 Checkout completado - Session ID: ${session.id}`);
    
    try {
      // Verificar id_user en metadatos
      const userId = session.metadata?.user_id;
      if (!userId) {
        console.error("❌ No se encontró user_id en los metadatos");
        return NextResponse.json(
          { error: "No se proporcionó user_id en los metadatos" },
          { status: 400 }
        );
      }
      
      // Generar ticket_id único
      const ticket_id = uuidv4();
      
      // Procesar productos desde metadata
      let productos = [];
      if (session.metadata?.productos) {
        try {
          productos = JSON.parse(session.metadata.productos);
          console.log("✅ Productos parseados:", JSON.stringify(productos).substring(0, 100) + "...");
        } catch (e) {
          console.error("❌ Error parseando productos:", e);
          productos = []; // Arreglo vacío como fallback
        }
      } else {
        console.warn("⚠️ No se encontraron productos en metadata");
      }
      
      // Insertar en Supabase con manejo de errores detallado
      console.log("🔍 Verificando si el user_id existe en la tabla de usuarios...");
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();
        
      if (userError) {
        console.error("❌ Usuario no existe en public.users. Rechazando el recibo.");
        return NextResponse.json(
          { error: "El usuario no existe en la base de datos" }, 
          { status: 400 }
        );
      }
      
      console.log("✅ Usuario verificado, procediendo a guardar recibo...");
      
      // Crear recibo con tipos de datos exactos según el schema
      const reciboData = {
        id_user: userId,
        ticket_id: ticket_id,
        stripe_session_id: session.id,
        total: Number((session.amount_total! / 100).toFixed(2)),
        productos: productos, // jsonb field
        fecha: new Date().toISOString().split("T")[0], // formato YYYY-MM-DD
        hora: new Date().toLocaleTimeString("en-US", { hour12: false }), // formato HH:MM:SS
        metodo_pago: session.payment_method_types?.[0] || "Tarjeta",
        status: "completed"
      };
      
      console.log("📝 Intentando guardar recibo:", JSON.stringify(reciboData));
      
      const { data, error } = await supabase
        .from("recibos")
        .insert([reciboData])
        .select();
      
      if (error) {
        console.error("❌ Error al guardar en Supabase:", error);
        console.error("- Código:", error.code);
        console.error("- Mensaje:", error.message);
        console.error("- Detalles:", error.details);
        
        // Diagnóstico específico según tipo de error
        if (error.code === "23505") {
          console.error("   ↪ Error de entrada duplicada. Posiblemente el ticket_id ya existe.");
        } else if (error.code === "23502") {
          console.error("   ↪ Violación de NOT NULL. Falta un campo obligatorio.");
          console.error("   ↪ Datos que se intentaron insertar:", reciboData);
        } else if (error.code === "42P01") {
          console.error("   ↪ La tabla 'recibos' no existe.");
        } else if (error.code === "42703") {
          console.error("   ↪ Alguna columna no existe en la tabla.");
        }
        
        return NextResponse.json(
          { error: `Error al guardar recibo: ${error.message}` }, 
          { status: 500 }
        );
      }
      
      console.log(`✅ Recibo guardado exitosamente. Ticket ID: ${ticket_id}`);
      return NextResponse.json({ 
        success: true,
        ticket_id,
        message: "Pago procesado exitosamente"
      });
    } catch (err: any) {
      console.error("❌ Error procesando el pago:", err);
      return NextResponse.json(
        { error: `Error interno: ${err.message || err}` },
        { status: 500 }
      );
    }
  }

  // Para otros tipos de eventos, solo confirmamos recepción
  return NextResponse.json({ received: true });
}
