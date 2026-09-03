import { notFound, redirect } from 'next/navigation';
import { currentStudio } from '@/lib/current';
import { query } from '@/lib/db';
import { formatDate } from '@/lib/dates';
import { formatPence } from '@/lib/money';
import { KIND_BLURB, KIND_LABEL, STATUS_LABEL, isKind, type Status } from '@/lib/shoots';
import { KIND_COVER, shot } from '@/lib/images';

export const dynamic = 'force-dynamic';

type Row = {
  id: number; title: string; shoot_date: Date | null; location: string; status: Status;
  fee_pence: number; client_name: string | null; cover: string | null; frames: string; picks: string;
};
type Frame = { id: number; url: string; caption: string; shoot_id: number; picked: boolean };

/** One collection: the shoots in it, and every frame from all of them. */
export default async function CollectionPage({ params }: { params: { kind: string } }) {
  const ctx = await currentStudio();
  if (!ctx) redirect('/signin');
  const kind = decodeURIComponent(params.kind);
  if (!isKind(kind)) return notFound();

  const [shoots, frames] = await Promise.all([
    query<Row>(
      `SELECT s.id, s.title, s.shoot_date, s.location, s.status, s.fee_pence, c.name AS client_name,
              (SELECT p.url FROM photos p WHERE p.shoot_id = s.id ORDER BY p.sort LIMIT 1) AS cover,
              (SELECT COUNT(*) FROM photos p WHERE p.shoot_id = s.id)::text AS frames,
              (SELECT COUNT(*) FROM selects sel JOIN photos p ON p.id = sel.photo_id
                WHERE p.shoot_id = s.id)::text AS picks
         FROM shoots s LEFT JOIN clients c ON c.id = s.client_id
        WHERE s.studio_id = $1 AND s.kind = $2
        ORDER BY s.shoot_date DESC NULLS LAST, s.id DESC`,
      [ctx!.studio.id, kind]),
    query<Frame>(
      `SELECT p.id, p.url, p.caption, p.shoot_id, (sel.id IS NOT NULL) AS picked
         FROM photos p
         JOIN shoots s ON s.id = p.shoot_id
         LEFT JOIN selects sel ON sel.photo_id = p.id
        WHERE s.studio_id = $1 AND s.kind = $2
        ORDER BY p.id DESC LIMIT 60`,
      [ctx!.studio.id, kind]),
  ]);

  const picks = frames.filter((f) => f.picked).length;

  return (
    <>
      <p className="eyebrow"><a href="/collections" style={{ color: 'inherit' }}>Collections</a></p>
      <h1>{KIND_LABEL[kind]}</h1>
      <p className="lede">{KIND_BLURB[kind]}</p>

      {shoots.length === 0 ? (
        <>
          <div className="band" style={{ marginTop: '1.6rem' }}>
            <img src={shot(KIND_COVER[kind], 1600)} alt="" />
          </div>
          <p className="empty">
            No {KIND_LABEL[kind].toLowerCase()} shoots yet. <a href="/shoots">Book one</a> and it
            arrives with its own shot list.
          </p>
        </>
      ) : (
        <>
          <dl className="stats">
            <div className="stat"><dt>Shoots</dt><dd>{shoots.length}</dd></div>
            <div className="stat"><dt>Frames</dt><dd>{frames.length >= 60 ? '60+' : frames.length}</dd></div>
            <div className="stat stat--amber"><dt>Picked</dt><dd>{picks}</dd></div>
          </dl>

          <section className="group">
            <div className="group__head"><h2>Shoots</h2><span className="group__count">{shoots.length}</span></div>
            <ul className="list">
              {shoots.map((s) => (
                <li className="row" key={s.id}>
                  {s.cover ? <img className="row__thumb" src={s.cover} alt="" loading="lazy" /> : <span className="row__thumb" />}
                  <div className="row__main">
                    <div className="row__title"><a href={`/shoots/${s.id}`}>{s.title}</a></div>
                    <div className="row__sub">
                      {s.client_name ?? 'no client'}
                      {s.location ? ` · ${s.location}` : ''}
                      {s.frames !== '0' ? ` · ${s.frames} frames` : ''}
                      {Number(s.picks) ? ` · ${s.picks} picked` : ''}
                    </div>
                  </div>
                  <span className="row__when">{formatDate(s.shoot_date)}</span>
                  {s.fee_pence > 0 ? <span className="row__when money">{formatPence(s.fee_pence)}</span> : null}
                  <span className={`chip chip--${s.status}`}>{STATUS_LABEL[s.status]}</span>
                </li>
              ))}
            </ul>
          </section>

          {frames.length > 0 ? (
            <section className="group">
              <div className="group__head">
                <h2>Every frame</h2>
                <span className="group__count">newest first{frames.length >= 60 ? ' · latest 60' : ''}</span>
              </div>
              <ul className="sheet">
                {frames.map((f) => (
                  <li className={f.picked ? 'plate plate--picked' : 'plate'} key={f.id}>
                    <a href={`/shoots/${f.shoot_id}`}>
                      <img src={f.url} alt={f.caption} loading="lazy" />
                    </a>
                    <div className="plate__cap"><span>{f.picked ? '★ ' : ''}{f.caption || 'Untitled'}</span></div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </>
  );
}
