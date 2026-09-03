'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkPassword, hashPassword, studioCode, userByEmail } from '@/lib/auth';
import { SESSION_COOKIE, signSession } from '@/lib/session';
import { ensureSchema, query, tx } from '@/lib/db';

const COOKIE = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: true, maxAge: 60 * 60 * 24 * 30 };

function back(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

/** Sign up and found the studio, in one transaction. */
export async function signUpAction(form: FormData): Promise<void> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const name = String(form.get('name') ?? '').trim();
  const studioName = String(form.get('studioName') ?? '').trim();

  if (!email || !password) back('/signup', 'An email and a password, please.');
  if (password.length < 8) back('/signup', 'Passwords need at least 8 characters.');
  if (!studioName) back('/signup', 'The studio needs a name.');

  await ensureSchema();
  if (await userByEmail(email)) back('/signup', 'That email already has an account. Sign in instead.');

  const hash = await hashPassword(password);
  const code = studioCode();
  const userId = await tx(async (q) => {
    const s = await q('INSERT INTO studios (code, name) VALUES ($1,$2) RETURNING id', [code, studioName]);
    const studioId = (s[0] as { id: number }).id;
    const u = await q('INSERT INTO users (studio_id, email, name, password_hash) VALUES ($1,$2,$3,$4) RETURNING id',
      [studioId, email, name || email.split('@')[0], hash]);
    return (u[0] as { id: number }).id;
  });
  cookies().set(SESSION_COOKIE, signSession(userId), COOKIE);
  redirect('/');
}

export async function joinAction(form: FormData): Promise<void> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  const name = String(form.get('name') ?? '').trim();
  const code = String(form.get('code') ?? '').trim().toUpperCase();

  if (!email || !password || !code) back('/join', 'Email, password and the studio code.');
  if (password.length < 8) back('/join', 'Passwords need at least 8 characters.');

  await ensureSchema();
  const found = await query<{ id: number }>('SELECT id FROM studios WHERE code = $1', [code]);
  if (!found[0]) back('/join', 'No studio has that code. Check it with whoever sent it.');
  if (await userByEmail(email)) back('/join', 'That email already has an account. Sign in instead.');

  const hash = await hashPassword(password);
  const rows = await query<{ id: number }>(
    'INSERT INTO users (studio_id, email, name, password_hash) VALUES ($1,$2,$3,$4) RETURNING id',
    [found[0].id, email, name || email.split('@')[0], hash]);
  cookies().set(SESSION_COOKIE, signSession(rows[0].id), COOKIE);
  redirect('/');
}

export async function signInAction(form: FormData): Promise<void> {
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const password = String(form.get('password') ?? '');
  if (!email || !password) back('/signin', 'An email and a password, please.');
  await ensureSchema();
  const user = await userByEmail(email);
  // One message either way: naming the wrong half tells an attacker which
  // emails have accounts.
  if (!user || !(await checkPassword(password, user.hash))) {
    back('/signin', 'That email and password do not match.');
  }
  cookies().set(SESSION_COOKIE, signSession(user!.id), COOKIE);
  redirect('/');
}

export async function signOutAction(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
  redirect('/signin');
}
