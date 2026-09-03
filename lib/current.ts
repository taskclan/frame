import { cookies } from 'next/headers';
import { SESSION_COOKIE, readSession } from './session';
import { userById, type User } from './auth';
import { query } from './db';

export type Studio = { id: number; code: string; name: string };

export async function currentUser(): Promise<User | null> {
  const id = readSession(cookies().get(SESSION_COOKIE)?.value);
  if (!id) return null;
  return userById(id);
}

export async function currentStudio(): Promise<{ user: User; studio: Studio } | null> {
  const user = await currentUser();
  if (!user) return null;
  const rows = await query<{ id: number; code: string; name: string }>(
    'SELECT id, code, name FROM studios WHERE id = $1', [user.studioId]);
  const s = rows[0];
  return s ? { user, studio: s } : null;
}
