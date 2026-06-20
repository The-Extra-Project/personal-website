import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { AllLocales, AppConfig } from './utils/AppConfig';

const intlMiddleware = createMiddleware({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
});

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
  '/api/waiting-list(.*)',
  '/:locale/api/waiting-list(.*)',
  '/api/stripe(.*)',
  '/:locale/api/stripe(.*)',
  '/api/organizations(.*)',
  '/:locale/api/organizations(.*)',
  '/api/webhooks(.*)',
  '/:locale/api/webhooks(.*)',
]);

// Public routes that Clerk middleware should skip entirely. The
// /api/pointcloud/* endpoints serve the IGN tile cache and the
// Gaussian splat registry, both of which need to be reachable from
// the Potree iframe without a Clerk session.
const isPublicRoute = createRouteMatcher([
  '/api/pointcloud(.*)',
  '/:locale/api/pointcloud(.*)',
]);

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  // Skip Clerk middleware entirely for public routes — otherwise
  // Clerk tries to validate the session token on every API call,
  // which 307-redirects to /sign-in when no token is present.
  // Also skip the i18n middleware for /api/* so API routes are
  // reachable at their canonical (non-localized) path.
  if (isPublicRoute(request)) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
    return intlMiddleware(request);
  }

  if (
    request.nextUrl.pathname.includes('/sign-in')
    || request.nextUrl.pathname.includes('/sign-up')
    || isProtectedRoute(request)
  ) {
    return clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        const locale
          = req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';

        const signInUrl = new URL(`${locale}/sign-in`, req.url);

        await auth.protect({
          // `unauthenticatedUrl` is needed to avoid error: "Unable to find `next-intl` locale because the middleware didn't run on this request"
          unauthenticatedUrl: signInUrl.toString(),
        });
      }

      const authObj = await auth();

      if (
        authObj.userId
        && !authObj.orgId
        && req.nextUrl.pathname.includes('/dashboard')
        && !req.nextUrl.pathname.endsWith('/organization-selection')
      ) {
        const orgSelection = new URL(
          '/onboarding/organization-selection',
          req.url,
        );

        return NextResponse.redirect(orgSelection);
      }

      return intlMiddleware(req);
    })(request, event);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next|monitoring).*)', '/', '/(api|trpc)(.*)'], // Also exclude tunnelRoute used in Sentry from the matcher
};
