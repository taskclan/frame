import { redirect } from 'next/navigation';
import { currentStudio } from '@/lib/current';
import { query } from '@/lib/db';
import { KINDS, KIND_BLURB, KIND_LABEL } from '@/lib/shoots';
import { KIND_COVER, shot } from '@/lib/images';

export const dynamic = 'force-dynamic';

type Tally = { kind: string; shoots: string; frames: string; picks: string; cover: string | null };

/**
 * The studio's work, by occasion.
 *
 * Every collection is listed, including the empty ones — a photographer who
 * has never shot a graduation still wants to see that the shelf exists, and
 * what would go on it. Empty collections sort last but keep their cover and
 * their one-line description, because that is the whole point of showing them.
 */
export default async function CollectionsPage() {
  const ctx = await currentStudio();
  if (!ctx) redirect('/signin');

  const tallies = await query<Tally>(
    `SELECT s.kind,
            COUNT(DISTINCT s.id)::text AS shoots,
            COUNT(p.id)::text AS frames,
            COUNT(sel.id)::text AS picks,
            (SELECT p2.url FROM photos p2
               JOIN shoots s2 ON s2.id = p2.shoot_id
              WHERE s2.studio_id = $1 AND s2.kind = s.kind
              ORDER BY p2.id DESC LIMIT 1) AS cover
       FROM shoots s
       LEFT JOIN photos p ON p.shoot_id = s.id
       LEFT JOIN selects sel ON sel.photo_id = p.id
      WHERE s.studio_id = $1
      GROUP BY s.kind`,
    [ctx!.studio.id],
  );
  const by = new Map(tallies.map((t) => [t.kind, t]));
  const shot_ = (id: string) => shot(id, 900);

  // Collections with work first, in the studio's own order; the rest after.
  const ordered = [...KINDS].sort((a, b) => {
    const A = Number(by.get(a)?.shoots ?? 0) > 0 ? 0 : 1;
    const B = Number(by.get(b)?.shoots ?? 0) > 0 ? 0 : 1;
    return A - B || KINDS.indexOf(a) - KINDS.indexOf(b);
  });
  const total = tallies.reduce((n, t) => n + Number(t.shoots), 0);

  return (
    <>
      <p className="eyebrow">Collections</p>
      <h1>{total === 0 ? 'Nothing shot yet' : `${total} shoot${total === 1 ? '' : 's'}, ${tallies.length} collection${tallies.length === 1 ? '' : 's'}`}</h1>
      <p className="lede">Your work by occasion. Each one books with its own shot list.</p>

      <ul className="collections">
        {ordered.map((k) => {
          const t = by.get(k);
          const shoots = Number(t?.shoots ?? 0);
          const cover = t?.cover ?? shot_(KIND_COVER[k]);
          return (
            <li className={shoots ? 'coll' : 'coll coll--empty'} key={k}>
              <a href={`/collections/${k}`}>
                <span className="coll__frame">
                  <img src={cover} alt="" loading="lazy" />
                </span>
                <span className="coll__body">
                  <span className="coll__name">{KIND_LABEL[k]}</span>
                  <span className="coll__blurb">{KIND_BLURB[k]}</span>
                  <span className="coll__meta">
                    {shoots === 0
                      ? 'Nothing here yet'
                      : `${shoots} shoot${shoots === 1 ? '' : 's'} · ${t!.frames} frames${Number(t!.picks) ? ` · ${t!.picks} picked` : ''}`}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
