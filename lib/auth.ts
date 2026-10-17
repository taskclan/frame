import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from './db';

export type User = { id: number; email: string; name: string; studioId: number };

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function checkPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function userById(id: number): Promise<User | null> {
  const rows = await query<{ id: number; email: string; name: string; studio_id: number }>(
    'SELECT id, email, name, studio_id FROM users WHERE id = $1', [id]);
  const r = rows[0];
  return r ? { id: r.id, email: r.email, name: r.name, studioId: r.studio_id } : null;
}

export async function userByEmail(email: string): Promise<(User & { hash: string }) | null> {
  const rows = await query<{ id: number; email: string; name: string; studio_id: number; password_hash: string }>(
    'SELECT id, email, name, studio_id, password_hash FROM users WHERE lower(email) = lower($1)', [email]);
  const r = rows[0];
  return r ? { id: r.id, email: r.email, name: r.name, studioId: r.studio_id, hash: r.password_hash } : null;
}

/** The code a second photographer types to join the studio. Read aloud, so no I, O, 0 or 1. */
export function studioCode(): string {
  // A join code grants studio membership, so it is a credential and comes from
  // the same CSPRNG as the gallery token — never Math.random, which is
  // predictable and recoverable from a single observed code. The alphabet is
  // 32 letters = 5 bits each, so a random byte masks cleanly to one letter with
  // no bias; eight letters is ~40 bits, well past guessing a permanent code.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) out += alphabet[bytes[i] & 31];
  return out;
}

/**
 * The gallery link.
 *
 * Not from the friendly alphabet: this one is never typed, only clicked, and
 * it is the only thing protecting a client's photographs. 32 hex characters
 * from a CSPRNG, not Math.random — a guessable gallery link is a leak of
 * somebody's wedding.
 */
export function galleryToken(): string {
  return randomBytes(16).toString('hex');
}
