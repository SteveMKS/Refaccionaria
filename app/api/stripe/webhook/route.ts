import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

interface CartItem {
  id_sku: string;
  name: string;
  price: number;
  quantity: number;
  descripcion?: string;
  imagen_principal?: string;
}

interface RequestBody {
  cart: CartItem[];
  email: string;
  user_id: string;
  total: number;
}

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!stripeKey || !supabaseUrl || !supabaseKey || !siteUrl?.startsWith("http")) {
      throw new Error("Variables de entorno faltantes o inválidas");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" });
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RequestBody = await req.json();
    const { cart, user_id, email, total } = body;

    if (!cart?.length || !user_id || !email) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Verificar stock
    for (const item of cart) {
      const { data: product, error } = await supabase
        .from("productos")
        .select("existencias, activo, nombre")
        .eq("id_sku", item.id_sku)
        .single();

      if (error || !product) {
        return NextResponse.json({ error: `Producto no encontrado: ${item.id_sku}` }, { status: 404 });
      }

      if (!product.activo || product.existencias < item.quantity) {
        return NextResponse.json({ error: `Stock insuficiente para: ${product.nombre}` }, { status: 400 });
      }
    }

    // Crear sesión en Stripe
    const line_items = cart.map((item) => ({
      price_data: {
        currency: "mxn",
        product_data: {
          name: item.name,
          description: item.descripcion || "",
          images: item.imagen_principal ? [item.imagen_principal] : [],
          metadata: { id_sku: item.id_sku },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: email,
      success_url: `${siteUrl}/Payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/Payments/cancel`,
      metadata: {
        userId: user_id,
      },
    });

    // Guardar el recibo en Supabase
    const { error: insertError } = await supabase.from("recibos").insert({
      id_user: user_id,
      total,
      status: "pendiente", // se actualizará a "pagado" con webhook
      metodo_pago: "tarjeta",
      productos: cart,
      ticket_id: session.id,
      fecha: new Date().toISOString().split("T")[0],
      hora: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error al registrar el recibo:", insertError);
      return NextResponse.json({ error: "Error al registrar el recibo" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error en checkout:", error);
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 });
  }
}

// Webhook para confirmar pago y actualizar stock
export async function handleStripeWebhook(event: Stripe.Event) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Aquí obtienes los datos necesarios, por ejemplo, del recibo en tu DB
    const { data: recibo, error: reciboError } = await supabase
      .from("recibos")
      .select("*")
      .eq("ticket_id", session.id)
      .single();

    if (reciboError || !recibo) {
      console.error("Recibo no encontrado para ticket:", session.id);
      return;
    }

    const productosComprados: CartItem[] = recibo.productos;

    // Actualizar stock para cada producto
    for (const item of productosComprados) {
      const { data: productoActual, error: errorProducto } = await supabase
        .from("productos")
        .select("existencias")
        .eq("id_sku", item.id_sku)
        .single();

      if (errorProducto || !productoActual) {
        console.error("Producto no encontrado para stock:", item.id_sku);
        continue;
      }

      const nuevoStock = productoActual.existencias - item.quantity;

      if (nuevoStock < 0) {
        console.error("Stock insuficiente para:", item.id_sku);
        continue;
      }

      const { error: updateError } = await supabase
        .from("productos")
        .update({ existencias: nuevoStock })
        .eq("id_sku", item.id_sku);

      if (updateError) {
        console.error("Error actualizando stock para:", item.id_sku, updateError);
      }
    }

    // Actualizar estado del recibo a pagado
    const { error: updateReciboError } = await supabase
      .from("recibos")
      .update({ status: "pagado" })
      .eq("ticket_id", session.id);

    if (updateReciboError) {
      console.error("Error actualizando recibo a pagado:", updateReciboError);
    }
  }
}
