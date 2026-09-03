import { currentStudio } from '@/lib/current';
import { query } from '@/lib/db';
import { daysUntil, formatDate } from '@/lib/dates';
import { STATUS_LABEL, nextStatus, type Status } from '@/lib/shoots';
import { Landing } from './landing';
import { advanceShootAction } from './studio-actions';

export const dynamic = 'force-dynamic';

type Row = {
  id: number; title: string; kind: string; shoot_date: Date | null; location: string;
  status: Status; client_name: string | null; cover: string | null;
  photos: string; picks: string;
};
type Stats = { upcoming: string; editing: string; delivered: string; picks: string };

export default async function BoardPage() {
  const ctx = await currentStudio();
  if (!ctx) return <Landing />;
  const { studio } = ctx;

  const [stats] = await query<Stats>(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('enquiry','booked') AND (shoot_date IS NULL OR shoot_date >= now()::date))::text AS upcoming,
       COUNT(*) FILTER (WHERE status IN ('shot','editing'))::text AS editing,
       COUNT(*) FILTER (WHERE status = 'delivered')::text AS delivered,
       (SELECT COUNT(*) FROM selects sel
          JOIN photos p ON p.id = sel.photo_id
          JOIN shoots s2 ON s2.id = p.shoot_id
         WHERE s2.studio_id = $1)::text AS picks
     FROM shoots WHERE studio_id = $1`,
    [studio.id],
  );

  const open = await query<Row>(
    `SELECT s.id, s.title, s.kind, s.shoot_date, s.location, s.status, c.name AS client_name,
            (SELECT p.url FROM photos p WHERE p.shoot_id = s.id ORDER BY p.sort LIMIT 1) AS cover,
            (SELECT COUNT(*) FROM photos p WHERE p.shoot_id = s.id)::text AS photos,
            (SELECT COUNT(*) FROM selects sel JOIN photos p ON p.id = sel.photo_id
              WHERE p.shoot_id = s.id)::text AS picks
       FROM shoots s LEFT JOIN clients c ON c.id = s.client_id
      WHERE s.studio_id = $1 AND s.status <> 'delivered'
      ORDER BY s.shoot_date NULLS LAST, s.id DESC LIMIT 12`,
    [studio.id],
  );

  return (
    <>
      <p className="eyebrow">{studio.name}</p>
      <h1>{open.length === 0 ? 'Nothing in the diary' : `${open.length} on the go`}</h1>

      <dl className="stats">
        <div className="stat"><dt>Upcoming</dt><dd>{stats?.upcoming ?? '0'}</dd></div>
        <div className="stat stat--amber"><dt>In edit</dt><dd>{stats?.editing ?? '0'}</dd></div>
        <div className="stat"><dt>Delivered</dt><dd>{stats?.delivered ?? '0'}</dd></div>
        <div className="stat stat--amber"><dt>Client picks</dt><dd>{stats?.picks ?? '0'}</dd></div>
      </dl>

      <section className="group">
        <div className="group__head">
          <h2>In the diary</h2>
          <span className="group__count"><a href="/shoots">All shoots →</a></span>
        </div>
        {open.length === 0 ? (
          <p className="empty">Nothing booked. <a href="/shoots">Book a shoot.</a></p>
        ) : (
          <ul className="list">
            {open.map((s) => {
              const days = daysUntil(s.shoot_date);
              const soon = days !== null && days >= 0 && days <= 7;
              const next = nextStatus(s.status);
              return (
                <li className={soon ? 'row row--soon' : 'row'} key={s.id}>
                  {s.cover ? <img className="row__thumb" src={s.cover} alt="" loading="lazy" /> : <span className="row__thumb" />}
                  <div className="row__main">
                    <div className="row__title"><a href={`/shoots/${s.id}`}>{s.title}</a></div>
                    <div className="row__sub">
                      {s.client_name ?? 'no client yet'}
                      {s.location ? ` · ${s.location}` : ''}
                      {s.picks !== '0' ? ` · ${s.picks} picked` : ''}
                    </div>
                  </div>
                  <span className="row__when">
                    {days === null ? 'no date' : days === 0 ? 'today' : days > 0 ? `in ${days}d` : formatDate(s.shoot_date)}
                  </span>
                  <span className={`chip chip--${s.status}`}>{STATUS_LABEL[s.status]}</span>
                  {next ? (
                    <form action={advanceShootAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="current" value={s.status} />
                      <input type="hidden" name="back" value="/" />
                      <button className="btn btn--quiet btn--small" type="submit">→ {STATUS_LABEL[next]}</button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
