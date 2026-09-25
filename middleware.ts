import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME } from './src/lib/auth-config';
import { getSessionSecret, verifySession } from './src/lib/session-token';

/** Edge-safe gate: signature + expiry check only (no DB here).
 *  Full validation (revocation, DB expiry) happens in getSessionUser(),
 *  which every page and action calls. A forged-but-valid-looking cookie
 *  gets past this layer and is rejected one step later.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  let authed = false;
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    authed = !!token && (await verifySession(getSessionSecret(), token)) !== null;
  } catch {
    authed = false;
  }

  if (!authed && pathname !== '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (authed && pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.delete('next');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|manifest.webmanifest).*)'],
};
