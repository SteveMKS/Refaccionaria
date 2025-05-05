// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  // Definición de rutas
  const publicRoutes = ['/login', '/Registro', '/'];
  const authRoutes = ['/Perfil', '/Compras'];
  const adminRoutes = ['/Admin'];

  // 1. Protección para usuarios no autenticados
  if (!session) {
    // Bloquear acceso a rutas que requieren autenticación
    if (authRoutes.some(route => path.startsWith(route))) {
      return NextResponse.redirect(new URL(`/login?redirectTo=${encodeURIComponent(path)}`, req.url));
    }
    
    // Bloquear acceso a rutas admin si no hay sesión
    if (adminRoutes.some(route => path.startsWith(route))) {
      return NextResponse.redirect(new URL(`/login?redirectTo=${encodeURIComponent(path)}`, req.url));
    }
    
    // Permitir continuar si es ruta pública
    return res;
  }

  // 2. Redirigir usuarios autenticados que intentan acceder a rutas públicas
  if (publicRoutes.includes(path)) {
    return NextResponse.redirect(new URL('/Perfil', req.url));
  }

  // 3. Verificación de roles (solo para usuarios autenticados)
  const { data: user } = await supabase
    .from('users')
    .select('rol')
    .eq('id', session.user.id)
    .single();

  // 3.1. Redirigir si no es admin en ruta /Admin
  if (adminRoutes.some(route => path.startsWith(route)) && user?.rol !== 'admin') {
    return NextResponse.redirect(new URL('/Perfil', req.url));
  }

  // 3.2. Opcional: Redirigir empleados desde /Admin
  if (path.startsWith('/Admin') && user?.rol === 'empleado') {
    return NextResponse.redirect(new URL('/Perfil', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};