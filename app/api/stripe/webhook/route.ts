import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  
  if (!sig) {
    console.error("❌ Falta firma de Stripe");
    return NextResponse.json({ error: "Falta firma de Stripe" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const bodyBuffer = Buffer.from(await req.arrayBuffer());
    event = stripe.webhooks.constructEvent(
      bodyBuffer, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log("✅ Evento verificado correctamente");
  } catch (err: any) {
    console.error("❌ Error verificando webhook:", err.message);
    return NextResponse.json(
      { error: "Firma inválida", details: err.message }, 
      { status: 400 }
    );
  }

  console.log(`📩 Evento recibido: ${event.type}`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("🧾 Session ID:", session.id);
    console.log("💰 Amount:", session.amount_total);
    console.log("📦 Metadata:", session.metadata);

    const userId = session.metadata?.user_id;
    
    if (!userId) {
      console.error("❌ No se proporcionó user_id en metadata");
      return NextResponse.json({ error: "No se proporcionó user_id" }, { status: 400 });
    }

    // 🔥 Verificar que el usuario existe en la base de datos
    const { data: userExists, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !userExists) {
      console.error("❌ Usuario no encontrado en la base de datos:", userId);
      return NextResponse.json(
        { error: "Usuario no encontrado", userId }, 
        { status: 400 }
      );
    }

    console.log("✅ Usuario validado:", userId);

    // Preferir el ticket_id que se envió al crear la sesión (coincide con el recibo 'pendiente')
    const ticketIdFromMetadata = session.metadata?.ticket_id || null;

    // Intentar localizar un recibo existente (pendiente o completado) por ticket_id o por id de sesión
    const { data: reciboExistente, error: errorBuscar } = await supabase
      .from("recibos")
      .select("*")
      .or(
        [
          ticketIdFromMetadata ? `ticket_id.eq.${ticketIdFromMetadata}` : "",
          `stripe_session_id.eq.${session.id}`,
          `stripe_session.eq.${session.id}`,
        ]
          .filter(Boolean)
          .join(",")
      )
      .maybeSingle();

    if (errorBuscar) {
      console.warn("⚠️ Error buscando recibo existente (continuaremos):", errorBuscar.message);
    }

    // Idempotencia básica: si ya está completado, no volvemos a descontar
    if (reciboExistente && reciboExistente.status === "completed") {
      console.log("ℹ️ Recibo ya completado. No se repite el descuento de inventario.");
      // Asegurar limpieza de carrito (operación idempotente)
      const { error: clearErr } = await supabase
        .from("carritos")
        .delete()
        .eq("user_id", userId);
      if (clearErr) {
        console.warn("⚠️ No se pudo limpiar el carrito (idempotente):", clearErr.message);
      }
      return NextResponse.json({ success: true, ticket_id: reciboExistente.ticket_id, recibo: reciboExistente });
    }

    // Obtener lista de productos desde recibo existente o metadata
    let productos: Array<{ id: string; quantity: number; name?: string }> = [];
    try {
      if (reciboExistente?.productos && Array.isArray(reciboExistente.productos)) {
        productos = reciboExistente.productos as any;
      } else if (session.metadata?.productos) {
        productos = JSON.parse(session.metadata.productos);
      }
    } catch (err) {
      console.error("❌ Error parseando productos de metadata:", err);
      productos = [];
    }

    if (!productos || productos.length === 0) {
      console.error("❌ No se encontraron productos para descontar inventario");
      return NextResponse.json({ error: "Productos no encontrados en el recibo o metadata" }, { status: 400 });
    }

    // 1) Descontar existencias por cada producto comprado
    for (const item of productos) {
      const sku = String(item.id);
      const cantidad = Number(item.quantity || 0);
      if (!sku || !cantidad || cantidad <= 0) continue;

      const { error: errorRPC } = await supabase.rpc("descontar_existencias", {
        sku,
        cantidad,
      });
      if (errorRPC) {
        console.error(`❌ Error descontando inventario SKU=${sku}:`, errorRPC.message);
        return NextResponse.json(
          { error: `Error al descontar inventario de SKU ${sku}` },
          { status: 500 }
        );
      }
    }

    const ahora = new Date();
    const total = Number(((session.amount_total || 0) / 100).toFixed(2));
    const metodoPago = session.payment_method_types?.[0] || "card";

    // 2) Actualizar recibo existente (si venía en pendiente), si no existe entonces crearlo
    if (reciboExistente) {
      const { data: act, error: errorUpdate } = await supabase
        .from("recibos")
        .update({
          status: "completed",
          stripe_session_id: session.id,
          total,
          metodo_pago: metodoPago,
          // Preferimos conservar los productos existentes; si no había, guardamos los de metadata
          productos: reciboExistente.productos?.length ? reciboExistente.productos : productos,
        })
        .eq("ticket_id", reciboExistente.ticket_id)
        .select();

      if (errorUpdate) {
        console.error("❌ Error actualizando recibo existente:", errorUpdate.message);
        return NextResponse.json({ error: "Error actualizando recibo" }, { status: 500 });
      }

      // Limpiar carrito del usuario después de completar la compra (idempotente)
      const { error: clearErr } = await supabase
        .from("carritos")
        .delete()
        .eq("user_id", userId);
      if (clearErr) {
        console.warn("⚠️ No se pudo limpiar el carrito tras actualizar recibo:", clearErr.message);
      }

      console.log("✅ Recibo actualizado a completed, stock descontado y carrito limpio.");
      return NextResponse.json({ success: true, ticket_id: reciboExistente.ticket_id, recibo: act?.[0] });
    }

    // 3) Crear recibo nuevo si no existía uno previo
    const ticket_id = ticketIdFromMetadata || uuidv4();
    const reciboData = {
      id_user: userId,
      ticket_id,
      stripe_session_id: session.id,
      total,
      productos,
      fecha: ahora.toISOString().split("T")[0],
      hora: ahora.toTimeString().split(" ")[0],
      metodo_pago: metodoPago,
      status: "completed",
    };

    const { data, error } = await supabase
      .from("recibos")
      .insert([reciboData])
      .select();

    if (error) {
      console.error("❌ Error insertando recibo:", error.message);
      return NextResponse.json({ error: "Error insertando recibo" }, { status: 500 });
    }

    // Limpiar carrito del usuario después de completar la compra (idempotente)
    const { error: clearErr } = await supabase
      .from("carritos")
      .delete()
      .eq("user_id", userId);
    if (clearErr) {
      console.warn("⚠️ No se pudo limpiar el carrito tras crear recibo:", clearErr.message);
    }

    console.log("✅ Recibo creado, stock descontado y carrito limpio.");
    return NextResponse.json({ success: true, ticket_id, recibo: data?.[0] });
  }

  console.log(`⚠️ Evento no manejado: ${event.type}`);
  return NextResponse.json({ received: true });
}
