// app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// 1. Definición de tipos
type CartItem = {
  id_sku: string;
  name: string;
  price: number;
  quantity: number;
};

type RequestBody = {
  cartItems: CartItem[];
  userEmail: string;
  userId: string;
};

type ProductFromDB = {
  existencias: number;
  nombre: string;
};

// 2. Inicialización segura de clientes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !stripeKey) {
  throw new Error("Faltan variables de entorno requeridas");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeKey, {
  apiVersion: "2025-03-31.basil",
});

// 3. Endpoint principal
export async function POST(request: Request) {
  try {
    // Validación básica del request
    if (!request.body) {
      return NextResponse.json(
        { error: "Cuerpo de la solicitud faltante" },
        { status: 400 }
      );
    }

    const { cartItems, userEmail, userId }: RequestBody = await request.json();

    // Validación de datos de entrada
    if (!Array.isArray(cartItems) || !userEmail || !userId) {
      return NextResponse.json(
        { error: "Datos de entrada inválidos" },
        { status: 400 }
      );
    }

    // 4. Verificación de stock mejorada
    const stockVerifications = await Promise.all(
      cartItems.map(async (item) => {
        const { data: product, error } = await supabase
          .from("productos")
          .select("existencias, nombre")
          .eq("id_sku", item.id_sku)
          .single();

        if (error || !product) {
          return { error: `Producto ${item.id_sku} no encontrado` };
        }

        if (product.existencias < item.quantity) {
          return {
            error: `Stock insuficiente para ${product.nombre}`,
            sku: item.id_sku,
            available: product.existencias,
            requested: item.quantity
          };
        }

        return { valid: true };
      })
    );

    const stockErrors = stockVerifications.filter(r => 'error' in r);
    if (stockErrors.length > 0) {
      return NextResponse.json(
        { errors: stockErrors },
        { status: 400 }
      );
    }

    // 5. Creación de sesión de pago
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

    const successUrl = new URL(
      "/payments/success",
      process.env.NEXT_PUBLIC_SITE_URL
    );
    successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail,
      line_items: lineItems,
      success_url: successUrl.toString(),
      cancel_url: new URL("/cart", process.env.NEXT_PUBLIC_SITE_URL).toString(),
      metadata: {
        userId,
        cart: JSON.stringify(cartItems),
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error: unknown) {
    // 6. Manejo de errores seguro
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en checkout:", errorMessage);
    
    return NextResponse.json(
      { error: "Error al procesar el pago" },
      { status: 500 }
    );
  }
}
