// app/api/stripe/webhook/route.ts
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
}
