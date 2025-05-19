import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // ⛔ Excluir rutas API (como el webhook)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  const publicRoutes = ['/', '/login', '/Registro'];
  const protectedRoutes = ['/Perfil', '/Compras', '/Scan', '/recibos'];
  const isAdminRoute = path.startsWith('/Admin');

  if (!session) {
    if (
      protectedRoutes.some(route => path.startsWith(route)) ||
      isAdminRoute
    ) {
      return NextResponse.redirect(
        new URL(`/login?redirectTo=${encodeURIComponent(path)}`, req.url)
      );
    }
    return res;
  }

  if (publicRoutes.includes(path)) {
    return NextResponse.redirect(new URL('/Perfil', req.url));
  }

  if (isAdminRoute) {
    const { data: user } = await supabase
      .from('users')
      .select('rol')
      .eq('id', session.user.id)
      .single();

    if (!user || (user.rol !== 'admin' && user.rol !== 'empleado')) {
      return NextResponse.redirect(new URL('/Perfil', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/', '/login', '/Registro',
    '/Perfil', '/Compras', '/Scan', '/recibos',
    '/Admin/:path*',
  ],
};
