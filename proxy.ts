import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type JwtPayload = {
  role?: string;
  exp?: number;
};

function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function canAccessAdminPath(pathname: string, role?: string) {
  if (!role) return false;

  const superAdminOnly = ['/admin/users'];
  const managerOrHigher = ['/admin/settings', '/admin/messages'];
  const adminOnly = ['/admin/webhooks'];

  if (superAdminOnly.some((path) => pathname.startsWith(path))) {
    return role === 'SUPER_ADMIN';
  }

  if (managerOrHigher.some((path) => pathname.startsWith(path))) {
    return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'MANAGER';
  }

  if (adminOnly.some((path) => pathname.startsWith(path))) {
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  }

  return true;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('authToken')?.value;
  const isLoginPage = pathname === '/admin/login';

  if (pathname.startsWith('/admin') && !isLoginPage && !authToken) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && authToken) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  if (pathname.startsWith('/admin') && !isLoginPage && authToken) {
    const payload = parseJwtPayload(authToken);

    const now = Math.floor(Date.now() / 1000);
    if (payload?.exp && payload.exp < now) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('sessionExpired', '1');
      return NextResponse.redirect(loginUrl);
    }

    if (!canAccessAdminPath(pathname, payload?.role)) {
      return NextResponse.redirect(new URL('/admin/dashboard?forbidden=1', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
