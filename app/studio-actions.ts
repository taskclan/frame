'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { currentStudio } from '@/lib/current';
import { query, tx } from '@/lib/db';
import { parsePounds } from '@/lib/money';
import { galleryToken } from '@/lib/auth';
import { SEED_GALLERY, shot } from '@/lib/images';
import { SHOT_LISTS, isKind, isStatus, nextStatus, type Kind, type Status } from '@/lib/shoots';

/** Every write is scoped by studio_id in the WHERE, never checked then trusted. */
async function mine() {
  const ctx = await currentStudio();
  if (!ctx) redirect('/signin');
  return ctx!;
}

export async function addShootAction(form: FormData): Promise<void> {
  const { studio } = await mine();
  const title = String(form.get('title') ?? '').trim();
  const kindRaw = String(form.get('kind') ?? 'portrait');
  const kind: Kind = isKind(kindRaw) ? kindRaw : 'portrait';
  const date = String(form.get('shootDate') ?? '').trim() || null;
  const location = String(form.get('location') ?? '').trim();
  const clientRaw = Number(form.get('clientId'));
  const clientId = Number.isInteger(clientRaw) && clientRaw > 0 ? clientRaw : null;
  if (!title) redirect('/shoots');

  const id = await tx(async (q) => {
    const rows = await q(
      `INSERT INTO shoots (studio_id, client_id, title, kind, shoot_date, location, fee_pence, gallery_token)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [studio.id, clientId, title, kind, date, location, parsePounds(form.get('fee')), galleryToken()],
    );
    const shootId = (rows[0] as { id: number }).id;
    // The shot list and a starting gallery, so the shoot is useful the moment
    // it exists rather than two empty lists asking the photographer to think.
    let sort = 0;
    for (const item of SHOT_LISTS[kind]) {
      await q('INSERT INTO shot_list (shoot_id, item, sort) VALUES ($1,$2,$3)', [shootId, item, sort]);
      sort += 1;
    }
    let psort = 0;
    for (const p of SEED_GALLERY[kind] ?? []) {
      await q('INSERT INTO photos (shoot_id, url, caption, sort) VALUES ($1,$2,$3,$4)',
        [shootId, shot(p.id, 1400), p.caption, psort]);
      psort += 1;
    }
    return shootId;
  });
  revalidatePath('/shoots');
  redirect(`/shoots/${id}`);
}

export async function advanceShootAction(form: FormData): Promise<void> {
  const { studio } = await mine();
  const id = Number(form.get('id'));
  const current = String(form.get('current') ?? '');
  if (Number.isInteger(id) && isStatus(current)) {
    const next = nextStatus(current as Status);
    // `status = $3` in the WHERE: two people advancing at once move it one
    // step, not two.
    if (next) {
      await query('UPDATE shoots SET status = $1 WHERE id = $2 AND status = $3 AND studio_id = $4',
        [next, id, current, studio.id]);
    }
  }
  revalidatePath('/'); revalidatePath('/shoots'); revalidatePath(`/shoots/${id}`);
  redirect(String(form.get('back') ?? '/shoots'));
}

export async function toggleShotAction(form: FormData): Promise<void> {
  const { studio } = await mine();
  const id = Number(form.get('id'));
  const shootId = Number(form.get('shootId'));
  if (Number.isInteger(id)) {
    await query(
      `UPDATE shot_list sl SET done = NOT sl.done
         FROM shoots s WHERE sl.id = $1 AND sl.shoot_id = s.id AND s.studio_id = $2`,
      [id, studio.id]);
  }
  revalidatePath(`/shoots/${shootId}`);
  redirect(`/shoots/${shootId}`);
}

export async function addPhotoAction(form: FormData): Promise<void> {
  const { studio } = await mine();
  const shootId = Number(form.get('shootId'));
  const url = String(form.get('url') ?? '').trim();
  const caption = String(form.get('caption') ?? '').trim();
  // Only http(s). A javascript: or data: URL here would be rendered into an
  // <img src> on a page shown to the client.
  if (Number.isInteger(shootId) && /^https:\/\/|^http:\/\//i.test(url)) {
    await query(
      `INSERT INTO photos (shoot_id, url, caption, sort)
       SELECT s.id, $2, $3, COALESCE((SELECT MAX(sort)+1 FROM photos WHERE shoot_id = s.id), 0)
         FROM shoots s WHERE s.id = $1 AND s.studio_id = $4`,
      [shootId, url, caption, studio.id]);
  }
  revalidatePath(`/shoots/${shootId}`);
  redirect(`/shoots/${shootId}`);
}

export async function deletePhotoAction(form: FormData): Promise<void> {
  const { studio } = await mine();
  const id = Number(form.get('id'));
  const shootId = Number(form.get('shootId'));
  if (Number.isInteger(id)) {
    await query(
      `DELETE FROM photos p USING shoots s
        WHERE p.id = $1 AND p.shoot_id = s.id AND s.studio_id = $2`, [id, studio.id]);
  }
  revalidatePath(`/shoots/${shootId}`);
  redirect(`/shoots/${shootId}`);
}

export async function addClientAction(form: FormData): Promise<void> {
  const { studio } = await mine();
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  if (name) await query('INSERT INTO clients (studio_id, name, email) VALUES ($1,$2,$3)', [studio.id, name, email]);
  revalidatePath('/clients');
  redirect('/clients');
}

export async function deleteClientAction(form: FormData): Promise<void> {
  const { studio } = await mine();
  const id = Number(form.get('id'));
  if (Number.isInteger(id)) {
    await query('DELETE FROM clients WHERE id = $1 AND studio_id = $2', [id, studio.id]);
  }
  revalidatePath('/clients');
  redirect('/clients');
}
