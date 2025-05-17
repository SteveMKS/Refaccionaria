import { NextApiRequest, NextApiResponse } from 'next'
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
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role para escritura sin restricciones
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sig = req.headers['stripe-signature'] as string
  const buf = await buffer(req)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('❌ Error verificando firma del webhook:', err)
    return res.status(400).send(`Webhook Error: ${err}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.user_id
    const total = session.amount_total ? session.amount_total / 100 : 0
    const metodo_pago = session.payment_method_types?.[0] || 'Desconocido'
    const ticketId = uuidv4()

    if (!userId) {
      console.error('❌ No se recibió user_id en metadata.')
      return res.status(400).json({ error: 'Falta user_id en metadata' })
    }

    // 1. Obtener productos del carrito
    const { data: cartItems, error: cartError } = await supabase
      .from('carritos')
      .select('*')
      .eq('user_id', userId)

    if (cartError || !cartItems || cartItems.length === 0) {
      console.error('❌ Error al obtener el carrito o está vacío:', cartError)
      return res.status(500).json({ error: 'Error al obtener el carrito o carrito vacío' })
    }

    // 2. Formatear productos
    const productosJSON = cartItems.map(item => ({
      producto_id: item.producto_id,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: item.cantidad,
      subtotal: item.precio * item.cantidad,
    }))

    // 3. Insertar en la tabla de recibos
    const { error: reciboError } = await supabase.from('recibos').insert({
      id_user: userId,
      fecha: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      hora: new Date().toISOString().slice(11, 19), // HH:MM:SS
      total,
      status: 'pagado',
      metodo_pago,
      productos: productosJSON,
      ticket_id: ticketId,
      stripe_session: session.id,
    })

    if (reciboError) {
      console.error('❌ Error al insertar el recibo:', reciboError)
      return res.status(500).json({ error: 'No se pudo insertar el recibo' })
    }

    // 4. Eliminar productos del carrito
    const { error: deleteError } = await supabase.from('carritos').delete().eq('user_id', userId)

    if (deleteError) {
      console.error('⚠️ Error al limpiar el carrito:', deleteError)
      // No retornamos error aquí porque el recibo ya se guardó exitosamente
    }

    console.log('✅ Recibo generado correctamente con ticket_id:', ticketId)
  }

  res.status(200).json({ received: true })
}
