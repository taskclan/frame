import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { currentStudio } from '@/lib/current';
import { query } from '@/lib/db';
import { formatDate } from '@/lib/dates';
import { formatPence } from '@/lib/money';
import { KIND_LABEL, STATUSES, STATUS_LABEL, nextStatus, type Status } from '@/lib/shoots';
import {
  addPhotoAction, advanceShootAction, deletePhotoAction, toggleShotAction,
} from '@/app/studio-actions';

export const dynamic = 'force-dynamic';

type Shoot = {
  id: number; title: string; kind: string; shoot_date: Date | null; location: string;
  status: Status; fee_pence: number; gallery_token: string | null; client_name: string | null;
};
type Shot = { id: number; item: string; done: boolean };
type Photo = { id: number; url: string; caption: string; picked: boolean };

export default async function ShootPage({ params }: { params: { id: string } }) {
  const ctx = await currentStudio();
  if (!ctx) redirect('/signin');
  const id = Number(params.id);
  if (!Number.isInteger(id)) return notFound();

  // Scoped to the studio: a guessed id from another studio is a 404, not
  // somebody else's client work.
  const found = await query<Shoot>(
    `SELECT s.id, s.title, s.kind, s.shoot_date, s.location, s.status, s.fee_pence,
            s.gallery_token, c.name AS client_name
       FROM shoots s LEFT JOIN clients c ON c.id = s.client_id
      WHERE s.id = $1 AND s.studio_id = $2`,
    [id, ctx!.studio.id],
  );
  const s = found[0];
  if (!s) return notFound();

  const [shots, photos] = await Promise.all([
    query<Shot>('SELECT id, item, done FROM shot_list WHERE shoot_id = $1 ORDER BY sort, id', [s.id]),
    query<Photo>(
      `SELECT p.id, p.url, p.caption, (sel.id IS NOT NULL) AS picked
         FROM photos p LEFT JOIN selects sel ON sel.photo_id = p.id
        WHERE p.shoot_id = $1 ORDER BY p.sort, p.id`, [s.id]),
  ]);

  const next = nextStatus(s.status);
  const reached = STATUSES.indexOf(s.status);
  const done = shots.filter((x) => x.done).length;
  const picks = photos.filter((p) => p.picked);
  const h = headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host') ?? ''}`;

  return (
    <>
      <p className="eyebrow">
        {KIND_LABEL[s.kind as keyof typeof KIND_LABEL] ?? s.kind}
        {s.client_name ? ` · ${s.client_name}` : ''}
      </p>
      <h1>{s.title}</h1>
      <p className="lede">
        {formatDate(s.shoot_date)}{s.location ? ` · ${s.location}` : ''}
        {s.fee_pence > 0 ? <> · <span className="money">{formatPence(s.fee_pence)}</span></> : null}
      </p>

      <ol className="rail">
        {STATUSES.map((st, i) => (
          <li key={st} className={i < reached ? 'done' : i === reached ? 'now' : ''}>{STATUS_LABEL[st]}</li>
        ))}
      </ol>

      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.4rem' }}>
        {next ? (
          <form action={advanceShootAction}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="current" value={s.status} />
            <input type="hidden" name="back" value={`/shoots/${s.id}`} />
            <button className="btn" type="submit">Mark {STATUS_LABEL[next]}</button>
          </form>
        ) : <span className="chip chip--delivered">Delivered</span>}
      </div>

      {s.gallery_token ? (
        <div className="sharebox">
          <strong>Client gallery</strong> — send this and they can star their picks. No account needed.
          <br />
          <code>{origin}/g/{s.gallery_token}</code>
          <br />
          <a className="note" href={`/g/${s.gallery_token}`}>Open it as they see it →</a>
        </div>
      ) : null}

      <section className="group">
        <div className="group__head">
          <h2>Shot list</h2>
          <span className="group__count">{done} of {shots.length}</span>
        </div>
        <ul className="checks">
          {shots.map((x) => (
            <li className={x.done ? 'check check--done' : 'check'} key={x.id}>
              <form action={toggleShotAction}>
                <input type="hidden" name="id" value={x.id} />
                <input type="hidden" name="shootId" value={s.id} />
                <button className={x.done ? 'tick tick--on' : 'tick'} type="submit"
                  aria-label={x.done ? `Mark "${x.item}" not done` : `Mark "${x.item}" done`} />
              </form>
              <span>{x.item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="group">
        <div className="group__head">
          <h2>Gallery</h2>
          <span className="group__count">
            {photos.length} frame{photos.length === 1 ? '' : 's'}
            {picks.length ? ` · ${picks.length} picked` : ''}
          </span>
        </div>

        <form className="addform" autoComplete="off" action={addPhotoAction}>
          <input type="hidden" name="shootId" value={s.id} />
          <label>Image URL<input name="url" placeholder="https://…" required /></label>
          <label>Caption<input name="caption" placeholder="Frame 51 — backlit" /></label>
          <button className="btn" type="submit">Add frame</button>
        </form>

        {photos.length === 0 ? (
          <p className="empty">No frames yet.</p>
        ) : (
          <ul className="sheet">
            {photos.map((p) => (
              <li className={p.picked ? 'plate plate--picked' : 'plate'} key={p.id}>
                <img src={p.url} alt={p.caption} loading="lazy" />
                <div className="plate__cap">
                  <span>{p.picked ? '★ ' : ''}{p.caption || 'Untitled'}</span>
                  <form action={deletePhotoAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="shootId" value={s.id} />
                    <button className="btn btn--quiet btn--small" type="submit">Remove</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p><a className="note" href="/shoots">← All shoots</a></p>
    </>
  );
}
