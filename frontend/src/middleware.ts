import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Verifica si una IP pertenece a una red privada/local */
function isPrivateIP(ip: string): boolean {
  // Normalizar IPv6 loopback y localhost
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') return true;
  // Extraer IPv4 de formato IPv6-mapped (::ffff:192.168.x.x)
  const ipv4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  const parts = ipv4.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  const [a, b] = parts;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  return false;
}

export function middleware(request: NextRequest) {
  // --- Restricción de red local ---
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  if (!isPrivateIP(ip)) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="es">
        <head><meta charset="UTF-8"><title>Acceso Restringido</title>
        <style>
          body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f1f6f3;color:#2c4c3b;}
          .card{background:white;border-radius:1.5rem;padding:3rem;text-align:center;max-width:400px;box-shadow:0 20px 60px rgba(0,0,0,.08);}
          h1{font-size:1.5rem;font-weight:900;margin-bottom:.5rem;}
          p{color:#6b7280;font-size:.95rem;}
          .icon{font-size:3rem;margin-bottom:1rem;}
        </style></head>
        <body><div class="card"><div class="icon">🔒</div>
          <h1>Acceso Solo en Local</h1>
          <p>Esta aplicación solo está disponible dentro de la red del negocio.<br>Conéctate al WiFi del local e inténtalo de nuevo.</p>
        </div></body>
      </html>`,
      { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

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
