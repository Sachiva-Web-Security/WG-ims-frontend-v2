import { NextResponse } from 'next/server';

// Protected routes and their required roles
const PROTECTED = [
    { path: '/super-admin', roles: ['SUPER_ADMIN'] },
    { path: '/admin', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { path: '/kitchen', roles: ['KITCHEN_USER', 'ADMIN', 'SUPER_ADMIN'] },
];

export function proxy(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('token')?.value;

    // If no token — redirect to login (except already on login/unauthorized)
    if (!token) {
        const isPublic = ['/login', '/unauthorized'].some(p => pathname.startsWith(p));
        if (!isPublic && pathname !== '/') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }

    // Decode JWT payload (no verification — trust the backend)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;

        // Role-based protection
        for (const route of PROTECTED) {
            if (pathname.startsWith(route.path) && !route.roles.includes(role)) {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
        }

        // Redirect authenticated users away from root and login page
        if (pathname === '/' || pathname === '/login') {
            if (role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/super-admin', request.url));
            if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
            return NextResponse.redirect(new URL('/kitchen', request.url));
        }
    } catch {
        // Invalid token — clear and redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/super-admin/:path*', '/admin/:path*', '/kitchen/:path*', '/login'],
};
