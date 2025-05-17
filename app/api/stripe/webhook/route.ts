// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Inicialización mejorada con verificación
function initializeServices() {
  console.log("Inicializando servicios para webhook...");
  
  // Usar NEXT_PUBLIC_SUPABASE_URL en lugar de SUPABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Verificar todas las variables
  if (!supabaseUrl || !supabaseKey || !stripeKey || !webhookSecret) {
    console.error("Variables de entorno faltantes:");
    console.error("- NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Presente" : "Faltante");
    console.error("- SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "Presente" : "Faltante");
    console.error("- STRIPE_SECRET_KEY:", stripeKey ? "Presente" : "Faltante");
    console.error("- STRIPE_WEBHOOK_SECRET:", webhookSecret ? "Presente" : "Faltante");
    throw new Error("Configuración incompleta para el webhook");
  }
  
  // Mostrar versiones truncadas de las claves para debugging
  console.log("Configuración:", {
    supabaseUrl,
    supabaseKey: `${supabaseKey.substring(0, 5)}...${supabaseKey.substring(supabaseKey.length - 5)}`,
    stripeKey: `${stripeKey.substring(0, 5)}...${stripeKey.substring(stripeKey.length - 5)}`,
    webhookSecret: `${webhookSecret.substring(0, 5)}...${webhookSecret.substring(webhookSecret.length - 5)}`
  });
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const stripe = new Stripe(stripeKey, {
    apiVersion: "2025-03-31.basil",
  });
  
  return { supabase, stripe, webhookSecret };
}

// Función para manejar el evento checkout.session.completed
async function handleCheckoutSessionCompleted(supabase: any, session: Stripe.Checkout.Session) {
  console.log("Procesando checkout.session.completed para session ID:", session.id);
  console.log("Metadata completa:", session.metadata);
  
  const { userId, cart: metadataCart } = session.metadata || {};
  
  if (!userId || !metadataCart) {
    console.error("Datos incompletos en metadata:", {
      userId: userId ? "Presente" : "Faltante",
      cart: metadataCart ? "Presente" : "Faltante",
      metadata: session.metadata
    });
    throw new Error("Datos incompletos en metadata de la sesión");
  }
  
  // Parsear carrito con manejo de errores
  let cartItems;
  try {
    cartItems = JSON.parse(metadataCart);
    console.log("Carrito parseado correctamente:", cartItems);
  } catch (error) {
    console.error("Error al parsear JSON del carrito:", error);
    console.error("Contenido raw del carrito:", metadataCart);
    throw new Error("Error al parsear el carrito de la metadata");
  }
  
  // Información para el recibo
  const now = new Date();
  const fecha = now.toISOString().split("T")[0];
  const hora = now.toTimeString().split(" ")[0];
  const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  
  console.log("Datos del recibo a crear:", { userId, fecha, hora, total, items: cartItems.length });
  
  // 1. Actualizar existencias de productos (con manejo detallado de errores)
  for (const item of cartItems) {
    console.log(`Procesando producto SKU: ${item.id_sku}, cantidad: ${item.quantity}`);
    
    const { data, error } = await supabase.rpc("descontar_existencias", {
      sku: item.id_sku,
      cantidad: item.quantity
    });
    
    if (error) {
      console.error(`Error al descontar existencias para SKU ${item.id_sku}:`, error);
      throw new Error(`Error al actualizar inventario para SKU ${item.id_sku}: ${error.message}`);
    }
    
    console.log(`Existencias actualizadas para SKU ${item.id_sku}:`, data);
  }
  
  // 2. Crear recibo en Supabase
  console.log("Creando recibo en la base de datos...");
  const reciboData = {
    id_user: userId,
    fecha,
    hora,
    total,
    status: "pagado",
    metodo_pago: "tarjeta",
    productos: cartItems,
    ticket_id: session.id,
  };
  
  console.log("Datos del recibo a insertar:", reciboData);
  
  const { data: ticket, error: reciboError } = await supabase
    .from("recibos")
    .insert(reciboData)
    .select()
    .single();
  
  if (reciboError) {
    console.error("Error al crear recibo:", reciboError);
    throw new Error(`Error al crear recibo: ${reciboError.message}`);
  }
  
  console.log("Recibo creado exitosamente:", ticket);
  
  // 3. Vaciar carrito del usuario
  console.log("Vaciando carrito del usuario...");
  const { error: carritoError } = await supabase
    .from("carritos")
    .delete()
    .eq("user_id", userId);
  
  if (carritoError) {
    console.error("Error al vaciar carrito:", carritoError);
    // No bloqueamos por este error, pero lo registramos
  } else {
    console.log("Carrito vaciado exitosamente");
  }
  
  return { ticket };
}

// Función para manejar el evento payment_intent.succeeded (alternativa)
async function handlePaymentIntentSucceeded(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  console.log("Procesando payment_intent.succeeded para ID:", paymentIntent.id);
  
  // Intenta obtener metadata desde el payment intent
  const metadata = paymentIntent.metadata || {};
  console.log("Metadata del payment intent:", metadata);
  
  // Si hay metadata con userId y cart, procesamos similar a checkout.session
  if (metadata.userId && metadata.cart) {
    try {
      return await handleCustomMetadata(supabase, metadata.userId, metadata.cart, paymentIntent.id);
    } catch (error) {
      console.error("Error procesando payment intent:", error);
      throw error;
    }
  } else {
    // Buscar si existe un recibo con este payment_intent_id
    const { data: existingReceipt, error } = await supabase
      .from("recibos")
      .select("*")
      .eq("ticket_id", paymentIntent.id)
      .single();
    
    if (!error && existingReceipt) {
      console.log("Ya existe un recibo para este payment intent:", existingReceipt.id);
      return { ticket: existingReceipt };
    }
    
    console.log("No hay suficiente información en el payment intent para crear un recibo");
    return null;
  }
}

// Función genérica para manejar metadata personalizada
async function handleCustomMetadata(supabase: any, userId: string, cartData: string, ticketId: string) {
  let cartItems;
  
  try {
    cartItems = JSON.parse(cartData);
  } catch (error) {
    console.error("Error al parsear JSON del carrito:", error);
    throw new Error("Formato inválido de carrito");
  }
  
  const now = new Date();
  const fecha = now.toISOString().split("T")[0];
  const hora = now.toTimeString().split(" ")[0];
  const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  
  // Actualizar existencias
  for (const item of cartItems) {
    const { error } = await supabase.rpc("descontar_existencias", {
      sku: item.id_sku,
      cantidad: item.quantity
    });
    
    if (error) {
      console.error(`Error al descontar existencias para SKU ${item.id_sku}:`, error);
      throw error;
    }
  }
  
  // Crear recibo
  const { data: ticket, error: reciboError } = await supabase
    .from("recibos")
    .insert({
      id_user: userId,
      fecha,
      hora,
      total,
      status: "pagado",
      metodo_pago: "tarjeta",
      productos: cartItems,
      ticket_id: ticketId,
    })
    .select()
    .single();
  
  if (reciboError) {
    console.error("Error al crear recibo:", reciboError);
    throw reciboError;
  }
  
  // Vaciar carrito
  await supabase
    .from("carritos")
    .delete()
    .eq("user_id", userId);
  
  return { ticket };
}

export async function POST(req: Request) {
  console.log("⚡ Webhook recibido - " + new Date().toISOString());
  
  try {
    const { supabase, stripe, webhookSecret } = initializeServices();
    
    // Obtener firma del webhook
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      console.error("Falta la firma de Stripe (stripe-signature) en los headers");
      return new NextResponse("Falta la firma de Stripe", { status: 400 });
    }
    
    // Logging básico de la solicitud
    console.log("Headers:", {
      "stripe-signature": `${sig.substring(0, 10)}...`,
      "content-type": req.headers.get("content-type")
    });
    
    // Obtener payload
    const buf = await req.arrayBuffer();
    const rawBody = Buffer.from(buf);
    console.log(`Payload recibido: ${rawBody.length} bytes`);
    
    // Verificar evento
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      console.log(`✅ Evento verificado: ${event.type}, id: ${event.id}`);
    } catch (err: any) {
      console.error("❌ Error verificando firma del webhook:", err.message);
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }
    
    // Manejar diferentes tipos de eventos
    let result = null;
    
    try {
      switch (event.type) {
        case "checkout.session.completed":
          console.log("🛒 Procesando evento checkout.session.completed");
          const session = event.data.object as Stripe.Checkout.Session;
          result = await handleCheckoutSessionCompleted(supabase, session);
          break;
          
        case "payment_intent.succeeded":
          console.log("💰 Procesando evento payment_intent.succeeded");
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          result = await handlePaymentIntentSucceeded(supabase, paymentIntent);
          break;
          
        case "charge.succeeded":
          console.log("💸 Procesando evento charge.succeeded");
          const charge = event.data.object as Stripe.Charge;
          console.log("Charge ID:", charge.id);
          console.log("Payment Intent ID:", charge.payment_intent);
          // Puedes agregar lógica específica para charge.succeeded si es necesario
          break;
          
        default:
          console.log(`⏩ Evento ignorado: ${event.type}`);
      }
      
      if (result) {
        console.log("✅ Procesamiento exitoso para", event.type);
        return NextResponse.json({ success: true, ...result });
      } else {
        console.log("⚠️ Nada que procesar para el evento", event.type);
        return NextResponse.json({ received: true, processed: false });
      }
      
    } catch (error: any) {
      console.error(`❌ Error procesando evento ${event.type}:`, error);
      return new NextResponse(`Error: ${error.message}`, { status: 500 });
    }
    
  } catch (error: any) {
    console.error("❌ Error global en el webhook:", error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}