import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validación básica
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email es requerido y debe ser texto' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Crear cliente Supabase con service role (sin RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // Usar el servicio de Auth Admin para obtener el usuario por email
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('[verify-email] Error obteniendo usuarios:', authError);
      return NextResponse.json(
        { error: 'Error al verificar correo' },
        { status: 500 }
      );
    }

    // Buscar si el email existe en los usuarios
    const userExists = users?.some((user) => user.email?.toLowerCase() === normalizedEmail);

    return NextResponse.json({ exists: userExists || false }, { status: 200 });
  } catch (err) {
    console.error('[verify-email] Error inesperado:', err);
    return NextResponse.json(
      { error: 'Error inesperado' },
      { status: 500 }
    );
  }
}
