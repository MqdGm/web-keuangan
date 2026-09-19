import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/',
  '/transactions',
  '/accounts',
  '/budgets',
  '/savings',
  '/debts',
  '/recurring',
  '/reports',
  '/categories',
  '/notifications',
  '/settings',
];

const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati static assets, internal files, dan API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/icon-192.png'
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('keuangan_session')?.value;
  const isAuthPage = AUTH_PAGES.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // 1. Jika sudah login dan mencoba membuka halaman login/register, arahkan ke dashboard
  if (isAuthPage && sessionToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Jika belum login dan mencoba membuka halaman protected
  if (!sessionToken && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
