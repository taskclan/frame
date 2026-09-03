import { redirect } from 'next/navigation';
import { currentStudio } from '@/lib/current';
import { query } from '@/lib/db';
import { formatDate } from '@/lib/dates';
import { formatPence } from '@/lib/money';
import { KINDS, KIND_LABEL, STATUS_LABEL, type Status } from '@/lib/shoots';
import { addShootAction } from '@/app/studio-actions';

export const dynamic = 'force-dynamic';

type Row = {
  id: number; title: string; kind: string; shoot_date: Date | null; location: string;
  status: Status; fee_pence: number; client_name: string | null; cover: string | null; photos: string;
};

export default async function ShootsPage() {
  const ctx = await currentStudio();
  if (!ctx) redirect('/signin');

  const [shoots, clients] = await Promise.all([
    query<Row>(
      `SELECT s.id, s.title, s.kind, s.shoot_date, s.location, s.status, s.fee_pence,
              c.name AS client_name,
              (SELECT p.url FROM photos p WHERE p.shoot_id = s.id ORDER BY p.sort LIMIT 1) AS cover,
              (SELECT COUNT(*) FROM photos p WHERE p.shoot_id = s.id)::text AS photos
         FROM shoots s LEFT JOIN clients c ON c.id = s.client_id
        WHERE s.studio_id = $1
        ORDER BY (s.status = 'delivered'), s.shoot_date DESC NULLS LAST, s.id DESC`,
      [ctx!.studio.id]),
    query<{ id: number; name: string }>('SELECT id, name FROM clients WHERE studio_id = $1 ORDER BY name', [ctx!.studio.id]),
  ]);

  return (
    <>
      <p className="eyebrow">Shoots</p>
      <h1>{shoots.length === 0 ? 'No shoots yet' : `${shoots.length} in the book`}</h1>
      <p className="lede">Every shoot arrives with a shot list for its kind and a gallery to fill.</p>

      <form className="addform" autoComplete="off" action={addShootAction}>
        <label>Title<input name="title" placeholder="Aria — studio portraits" required /></label>
        <label>Kind
          <select name="kind" defaultValue="portrait">
            {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </label>
        <label>Date<input type="date" name="shootDate" /></label>
        <label>Location<input name="location" placeholder="Studio 3, Peckham" /></label>
        <label>Client
          <select name="clientId" defaultValue="">
            <option value="">—</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Fee<input name="fee" placeholder="0.00" inputMode="decimal" /></label>
        <button className="btn" type="submit">Book it</button>
      </form>

      {shoots.length === 0 ? (
        <p className="empty">Book the first one — the shot list writes itself.</p>
      ) : (
        <ul className="list">
          {shoots.map((s) => (
            <li className="row" key={s.id}>
              {s.cover ? <img className="row__thumb" src={s.cover} alt="" loading="lazy" /> : <span className="row__thumb" />}
              <div className="row__main">
                <div className="row__title"><a href={`/shoots/${s.id}`}>{s.title}</a></div>
                <div className="row__sub">
                  {KIND_LABEL[s.kind as keyof typeof KIND_LABEL] ?? s.kind}
                  {s.client_name ? ` · ${s.client_name}` : ''}
                  {s.location ? ` · ${s.location}` : ''}
                  {s.photos !== '0' ? ` · ${s.photos} frames` : ''}
                </div>
              </div>
              <span className="row__when">{formatDate(s.shoot_date)}</span>
              {s.fee_pence > 0 ? <span className="row__when money">{formatPence(s.fee_pence)}</span> : null}
              <span className={`chip chip--${s.status}`}>{STATUS_LABEL[s.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
