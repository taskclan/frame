import { createHmac, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE = 'frame_session';

function secret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured) return configured;
  // Fail closed: the cookie is `userId.HMAC(userId)`, so a known signing key
  // lets anyone forge any user's session. Never sign with a constant in
  // production — require SESSION_SECRET and throw when it is missing.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set in production');
  }
  return 'frame-development-secret-not-for-production';
}

export function signSession(userId: number): string {
  const body = String(userId);
  return `${body}.${createHmac('sha256', secret()).update(body).digest('base64url')}`;
}

export function readSession(raw: string | undefined): number | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const want = createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(raw.slice(dot + 1));
  const b = Buffer.from(want);
  // Constant time: === leaks how much of the signature matched.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const id = Number(body);
  return Number.isInteger(id) && id > 0 ? id : null;
}
