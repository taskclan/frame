'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';

/**
 * What the client can do, from a link and nothing else.
 *
 * The token is the only credential, so it is part of every WHERE: a photo id
 * on its own proves nothing, and pairing it with the token means a starred
 * photo must belong to the gallery the star came from.
 */
export async function toggleSelectAction(form: FormData): Promise<void> {
  const token = String(form.get('token') ?? '').trim();
  const photoId = Number(form.get('photoId'));
  if (!token || !Number.isInteger(photoId)) redirect('/');

  const owned = await query<{ id: number }>(
    `SELECT p.id FROM photos p JOIN shoots s ON s.id = p.shoot_id
      WHERE p.id = $1 AND s.gallery_token = $2`,
    [photoId, token],
  );
  if (owned[0]) {
    const already = await query<{ id: number }>('SELECT id FROM selects WHERE photo_id = $1', [photoId]);
    if (already[0]) {
      await query('DELETE FROM selects WHERE photo_id = $1', [photoId]);
    } else {
      // Unique on photo_id, so a double-click is idempotent rather than two
      // rows the photographer would count twice.
      await query('INSERT INTO selects (photo_id) VALUES ($1) ON CONFLICT (photo_id) DO NOTHING', [photoId]);
    }
  }
  revalidatePath(`/g/${token}`);
  redirect(`/g/${token}`);
}
