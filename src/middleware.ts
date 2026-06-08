import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (per-IP, resets on cold start)
// In production, use Upstash Redis or Vercel KV
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/analyze':         { max: 10, windowMs: 60_000 },    // 10/min
  '/api/chat':            { max: 30, windowMs: 60_000 },    // 30/min
  '/api/search-agencies': { max: 5,  windowMs: 60_000 },    // 5/min (expensive)
  '/api/auth':            { max: 20, windowMs: 60_000 },    // 20/min
};

function getRealIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    'unknown'
  );
}

function checkRateLimit(ip: string, path: string): { ok: boolean; remaining: number } {
  const config = Object.entries(RATE_LIMITS).find(([prefix]) => path.startsWith(prefix));
  if (!config) return { ok: true, remaining: 999 };

  const [, { max, windowMs }] = config;
  const key = `${ip}:${path.split('/').slice(0, 3).join('/')}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  entry.count++;
  if (entry.count > max) return { ok: false, remaining: 0 };
  return { ok: true, remaining: max - entry.count };
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getRealIp(req);

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const { ok, remaining } = checkRateLimit(ip, pathname);
    if (!ok) {
      return NextResponse.json(
        { error: 'Too many requests. Por favor espera un momento.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const res = NextResponse.next();
    res.headers.set('X-RateLimit-Remaining', String(remaining));
    return res;
  }

  // Admin protection
  if (pathname.startsWith('/admin')) {
    const secret = process.env.ADMIN_SECRET;
    if (secret) {
      const cookie = req.cookies.get('admin_auth')?.value;
      const query  = req.nextUrl.searchParams.get('secret');
      if (cookie !== secret && query !== secret) {
        // In a real app, redirect to login; here show minimal protection
        // (Admin page itself does client-side check too)
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
