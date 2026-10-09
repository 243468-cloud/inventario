import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // --- Autenticación y roles ---
  const token = request.cookies.get('auth_token')?.value;
  const role = request.cookies.get('user_role')?.value;
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname.startsWith('/login');

  // Sin token y no es login → redirigir a login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Con token y es login → redirigir al inicio correspondiente
  if (token && isLoginPage) {
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/produccion', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si no es SUPER_ADMIN, restringir rutas
  if (token && role !== 'SUPER_ADMIN') {
    // Solo permitir /produccion y /salidas
    if (!pathname.startsWith('/produccion') && !pathname.startsWith('/salidas')) {
      return NextResponse.redirect(new URL('/produccion', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)).*)',
  ],
};
