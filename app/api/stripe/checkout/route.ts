// app/api/stripe/checkout/route.ts
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

    // Verificación de stock optimizada
    const stockResults = await Promise.all(
      cartItems.map(async (item) => {
        const { data: product, error } = await supabase
          .from("productos")
          .select("existencias, nombre")
          .eq("id_sku", item.id_sku)
          .single();

        if (error || !product) {
          return { 
            sku: item.id_sku,
            error: "PRODUCT_NOT_FOUND",
            message: `Producto ${item.id_sku} no encontrado`
          };
        }

        if (product.existencias < item.quantity) {
          return {
            sku: item.id_sku,
            error: "INSUFFICIENT_STOCK",
            message: `Stock insuficiente para ${product.nombre}`,
            available: product.existencias,
            requested: item.quantity
          };
        }

        return { sku: item.id_sku, valid: true };
      })
    );

    const stockErrors = stockResults.filter(result => !result.valid);
    if (stockErrors.length > 0) {
      return NextResponse.json(
        { 
          error: "Problemas con el inventario",
          details: stockErrors 
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
    const successUrl = new URL("/payments/success", siteUrl);
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
}
