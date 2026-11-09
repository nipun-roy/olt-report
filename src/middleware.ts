import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow Next.js internals, static files, and icons
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Check for Better Auth session token cookie
  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value;

  const isLoginPage = pathname === '/login';

  // 3. If user is NOT logged in
  if (!sessionToken) {
    // If requesting protected API routes (except /api/auth)
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        {
          success: false,
          error: 'অননুমোদিত অনুরোধ! দয়া করে প্রথমে সিস্টেমে লগইন করুন। (Unauthorized: Please log in)',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // If already on /login, let them view the page
    if (isLoginPage) {
      return NextResponse.next();
    }

    // Otherwise redirect to /login with callbackUrl
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. If user IS logged in and tries to visit /login, redirect to home/dashboard
  if (isLoginPage && sessionToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
