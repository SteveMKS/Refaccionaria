// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  // Definir rutas
  const publicRoutes = ['/', '/login', '/Registro'];
  const protectedRoutes = ['/Perfil', '/Compras', '/Scan', '/recibos'];
  const isAdminRoute = path.startsWith('/Admin');

  // 🔒 Si no hay sesión y se intenta acceder a rutas protegidas o admin
  if (!session) {
    if (
      protectedRoutes.some(route => path.startsWith(route)) ||
      isAdminRoute
    ) {
      return NextResponse.redirect(
        new URL(`/login?redirectTo=${encodeURIComponent(path)}`, req.url)
      );
    }
    return res; // Ruta pública, continuar
  }

  // 🔁 Si hay sesión y se intenta acceder a rutas públicas
  if (publicRoutes.includes(path)) {
    return NextResponse.redirect(new URL('/Perfil', req.url));
  }

  // ✅ Si es ruta /Admin, validar rol del usuario
  if (isAdminRoute) {
    const { data: user } = await supabase
      .from('users')
      .select('rol')
      .eq('id', session.user.id)
      .single();

    // Solo permitir acceso a empleados y administradores
    if (!user || (user.rol !== 'admin' && user.rol !== 'empleado')) {
      return NextResponse.redirect(new URL('/Perfil', req.url));
    }
  }

  return res;
}

// ⚙️ Configurar las rutas protegidas por el middleware
export const config = {
  matcher: [
    '/',              // Página principal
    '/login',         // Login
    '/Registro',      // Registro
    '/Perfil',
    '/Compras',
    '/Scan',
    '/recibos',
    '/Admin/:path*',  // Protege todo lo que comience con /Admin
  ],
};
