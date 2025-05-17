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

    const { error: insertError } = await supabase
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
        stripe_session: null, // se actualizará luego
      });

    if (insertError) {
      console.error("Error al crear recibo:", insertError);
      return NextResponse.json({ error: "Error al crear recibo" }, { status: 500 });
    }

    // 2. Crear sesión Stripe con metadata ticketId
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

    // 3. Actualizar recibo con session.id
    const { error: updateError } = await supabase
      .from("recibos")
      .update({ stripe_session: session.id })
      .eq("ticket_id", ticketId);

    if (updateError) {
      console.error("Error actualizando sesión Stripe:", updateError);
      return NextResponse.json({ error: "Error actualizando sesión Stripe" }, { status: 500 });
    }

    // 4. Retornar url al frontend
    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("Error en API Stripe checkout:", error);
    return NextResponse.json({ error: "Error inesperado en el servidor" }, { status: 500 });
  }
}

/*// app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// 1. Definición de tipos mejorada
interface CartItem {
  id_sku: string;
  name: string;
  price: number;
  quantity: number;
}

interface RequestBody {
  cartItems: CartItem[];
  userEmail: string;
  userId: string;
}

interface ProductFromDB {
  existencias: number;
  nombre: string;
}

// 2. Función para verificar variables de entorno
const getRequiredEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable de entorno requerida faltante: ${name}`);
  }
  return value;
};

// 3. Inicialización segura con verificación explícita
const initializeServices = () => {
  try {
    const supabaseUrl = getRequiredEnvVar("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseKey = getRequiredEnvVar("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = getRequiredEnvVar("STRIPE_SECRET_KEY");
    const siteUrl = getRequiredEnvVar("NEXT_PUBLIC_SITE_URL");

    return {
      supabase: createClient(supabaseUrl, supabaseKey),
      stripe: new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" }),
      siteUrl
    };
  } catch (error) {
    console.error("Error inicializando servicios:", error instanceof Error ? error.message : "Error desconocido");
    throw error;
  }
};

// 4. Endpoint principal con mejor manejo de errores
export async function POST(request: Request) {
  try {
    // Inicialización con verificación
    const { supabase, stripe, siteUrl } = initializeServices();

    // Validación del request
    if (!request.body) {
      return NextResponse.json(
        { error: "Cuerpo de la solicitud faltante" },
        { status: 400 }
      );
    }

    // Parse y validación de datos de entrada
    const { cartItems, userEmail, userId }: RequestBody = await request.json().catch(() => {
      throw new Error("Formato JSON inválido en el cuerpo de la solicitud");
    });

    if (!Array.isArray(cartItems) || !userEmail || !userId) {
      return NextResponse.json(
        { 
          error: "Datos de entrada inválidos",
          required: {
            cartItems: "Array de productos",
            userEmail: "string",
            userId: "string"
          }
        },
        { status: 400 }
      );
    }

// Verificación de stock con logging detallado
const stockResults = await Promise.all(
  cartItems.map(async (item) => {
    try {
      console.log(`Verificando stock para SKU: ${item.id_sku}, Cantidad: ${item.quantity}`);
      
      const { data: product, error, status } = await supabase
        .from("productos")
        .select("existencias, nombre, activo")
        .eq("id_sku", item.id_sku)
        .single();

      console.log(`Respuesta de Supabase para ${item.id_sku}:`, { 
        data: product, 
        error, 
        status 
      });

      // Verificar si el producto existe
      if (error || !product) {
        console.error(`Producto no encontrado: ${item.id_sku}`, error);
        return { 
          sku: item.id_sku,
          error: "PRODUCT_NOT_FOUND",
          message: `Producto ${item.id_sku} no encontrado en la base de datos`,
          supabaseError: error
        };
      }

      // Verificar si el producto está activo
      if (product.activo === false) {
        console.error(`Producto inactivo: ${item.id_sku}`);
        return {
          sku: item.id_sku,
          error: "PRODUCT_INACTIVE",
          message: `El producto ${product.nombre} está inactivo`
        };
      }

      // Verificar stock
      if (product.existencias < item.quantity) {
        console.error(`Stock insuficiente: ${item.id_sku}`, {
          existencias: product.existencias,
          solicitado: item.quantity
        });
        return {
          sku: item.id_sku,
          error: "INSUFFICIENT_STOCK",
          message: `Stock insuficiente para ${product.nombre}`,
          available: product.existencias,
          requested: item.quantity
        };
      }

      console.log(`Stock válido para ${item.id_sku}: ${product.existencias} disponibles`);
      return { sku: item.id_sku, valid: true, existencias: product.existencias };

    } catch (error) {
      console.error(`Error al verificar stock para ${item.id_sku}:`, error);
      return {
        sku: item.id_sku,
        error: "VERIFICATION_ERROR",
        message: `Error al verificar el stock`,
        details: error instanceof Error ? error.message : String(error)
      };
    }
  })
);

// Filtramos solo los errores para la respuesta
const stockErrors = stockResults.filter(result => !result.valid);
if (stockErrors.length > 0) {
  console.error("Errores de inventario encontrados:", stockErrors);
  return NextResponse.json(
    { 
      error: "Problemas con el inventario",
      details: stockErrors,
      suggestion: "Verifique los códigos SKU y la disponibilidad de productos"
    },
    { status: 400 }
  );
}

    // Preparación de items para Stripe
    const lineItems = cartItems.map(item => ({
      price_data: {
        currency: "mxn",
        product_data: {
          name: item.name,
          metadata: { id_sku: item.id_sku },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Configuración de URLs
    const successUrl = new URL("/Payments/success", siteUrl);
    successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

    const cancelUrl = new URL("/cart", siteUrl);

    // Creación de sesión en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail,
      line_items: lineItems,
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata: {
        userId,
        cart: JSON.stringify(cartItems.map(item => ({
          id_sku: item.id_sku,
          quantity: item.quantity,
          price: item.price
        }))),
      },
    });

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error: unknown) {
    // Manejo estructurado de errores
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    const errorDetails = error instanceof Error ? { stack: error.stack } : {};

    console.error("Error en endpoint /api/stripe/checkout:", {
      message: errorMessage,
      ...errorDetails
    });

    return NextResponse.json(
      { 
        error: "Error al procesar el pago",
        ...(process.env.NODE_ENV === "development" && {
          details: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        })
      },
      { status: 500 }
    );
  }
}*/