import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log all API requests so the user can see what's happening
  console.log(`\n[Next.js Server Logs] Received ${request.method} request to ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

export const config = {
  // Apply this middleware to API routes
  matcher: '/api/:path*',
};
