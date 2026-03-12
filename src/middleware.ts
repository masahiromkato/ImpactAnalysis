import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const isPrivate = process.env.IS_PRIVATE === 'true';

    if (!isPrivate) {
        return NextResponse.next();
    }

    const { searchParams } = new URL(request.url);
    const password = process.env.ACCESS_PASSWORD;
    const queryPw = searchParams.get('pw');
    const cookiePw = request.cookies.get('auth_password')?.value;

    // 1. Check if authenticated via query param or cookie
    const isAuthenticated = (queryPw === password) || (cookiePw === password);

    if (isAuthenticated) {
        const response = NextResponse.next();

        // Set cookie if authenticated via query param to persist access
        if (queryPw === password && !cookiePw) {
            response.cookies.set('auth_password', password || '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });
        }

        return response;
    }

    // 2. Not authenticated: return 401
    return new NextResponse(
        JSON.stringify({ error: '401 Unauthorized: Access Restricted' }),
        {
            status: 401,
            headers: { 'content-type': 'application/json' }
        }
    );
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - assets (standard Vite output directory)
         * - images, css, js (common static directories)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|assets|images|css|js).*)',
    ],
};
