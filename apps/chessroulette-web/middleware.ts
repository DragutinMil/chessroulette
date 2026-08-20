import { NextRequest, NextResponse } from 'next/server';

// EEA + UK + Switzerland — countries where Google's "European regulations"
// consent message applies. Ads are skipped entirely for these visitors.
const EEA_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE', // EU
  'IS', 'LI', 'NO', // EEA (non-EU)
  'GB', // UK
  'CH', // Switzerland
]);

// Runs on the Edge, sets is-eea cookie so pages/layout stay statically rendered.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const country = request.headers.get('x-vercel-ip-country');
  const isEEA = !!country && EEA_COUNTRY_CODES.has(country);
  response.cookies.set('is-eea', String(isEEA), {
    maxAge: 60 * 60 * 24, // 1 day, re-evaluated per session
  });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
