import { defineMiddleware, sequence } from 'astro:middleware';
import type { APIContext } from 'astro';
import { PROTECTED_ROUTES } from './constants/protectedRoutes';
const PUBLIC_ROUTES = ['/quoc-gia', '/the-loai','/them-phim'];
const checkAuthentication = defineMiddleware(
  async (context: APIContext, next) => {
    const isLoggedIn = context.cookies.get('loggedIn')?.value === 'true';
    if (isLoggedIn && context.url.pathname === '/') {
      return context.redirect('/danh-sach-phim/trang-1');
    }
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
      context.url.pathname.startsWith(route)
    )
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
      context.url.pathname.startsWith(route)
    );
    if (isProtectedRoute && !isLoggedIn && !isPublicRoute) {
      return context.redirect('/');
    }

    return next();
  }
);

export const onRequest = sequence(checkAuthentication);