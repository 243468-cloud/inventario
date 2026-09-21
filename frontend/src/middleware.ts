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

  // Con token y es login → redirigir al inicio
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Solo SUPER_ADMIN puede entrar a /usuarios
  if (pathname.startsWith('/usuarios') && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
