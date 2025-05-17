// app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // usa clave de Service Role
)

export async function POST(req: Request) {
  const body = await req.json()
  const { user_id } = body

  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  // 1. Obtener productos del carrito
  const { data: cartItems, error: cartError } = await supabase
    .from('carritos')
    .select('*')
    .eq('user_id', user_id)

  if (cartError || !cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: 'Carrito vacío o error al obtener datos' }, { status: 400 })
  }

  // 2. Crear line_items para Stripe
  const line_items = cartItems.map((item) => ({
    price_data: {
      currency: 'mxn',
      product_data: {
        name: item.nombre,
        description: item.descripcion || '',
        images: item.imagen_principal ? [item.imagen_principal] : [],
      },
      unit_amount: Math.round(item.precio * 100), // Stripe usa centavos
    },
    quantity: item.cantidad,
  }))

  // 3. Crear sesión de Stripe
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
      metadata: {
        user_id, // importante para crear el recibo después
      },
    })

    return NextResponse.json({ sessionUrl: session.url })
  } catch (err) {
    console.error('Error al crear la sesión de Stripe:', err)
    return NextResponse.json({ error: 'Error creando sesión de pago' }, { status: 500 })
  }
}
 