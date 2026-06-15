import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { nextUrl } = req;
    const isLoggedIn = !!req.nextauth.token;

    const isAuthRoute = ['/login', '/register'].includes(nextUrl.pathname);
    const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
    const isDashboardRoute = nextUrl.pathname.startsWith('/boards');

    if (isApiAuthRoute) {
      return NextResponse.next();
    }

    if (isAuthRoute) {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL('/boards', nextUrl));
      }
      return NextResponse.next();
    }

    if (!isLoggedIn && isDashboardRoute) {
      return NextResponse.redirect(new URL('/login', nextUrl));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};