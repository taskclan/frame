import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { formatDate } from '@/lib/dates';
import { KIND_LABEL } from '@/lib/shoots';
import { toggleSelectAction } from '@/app/gallery-actions';

export const dynamic = 'force-dynamic';

type Shoot = {
  id: number; title: string; kind: string; shoot_date: Date | null;
  studio_name: string; client_name: string | null;
};
type Photo = { id: number; url: string; caption: string; picked: boolean };

/**
 * The client's gallery. The token in the URL is the only credential.
 *
 * So this page shows only what a client should see: the frames, and which
 * ones they have starred. No fee, no status, no shot list, no other shoot —
 * a gallery link forwarded to a friend must not become a view of the
 * photographer's book.
 */
export default async function GalleryPage({ params }: { params: { token: string } }) {
  const token = decodeURIComponent(params.token).trim();
  // Cheap shape check before the query: the token is 32 hex characters, and
  // anything else is not worth a database round trip.
  if (!/^[0-9a-f]{32}$/i.test(token)) return notFound();

  const found = await query<Shoot>(
    `SELECT s.id, s.title, s.kind, s.shoot_date, st.name AS studio_name, c.name AS client_name
       FROM shoots s
       JOIN studios st ON st.id = s.studio_id
       LEFT JOIN clients c ON c.id = s.client_id
      WHERE s.gallery_token = $1`,
    [token],
  ).catch(() => []);
  const s = found[0];
  if (!s) return notFound();

  const photos = await query<Photo>(
    `SELECT p.id, p.url, p.caption, (sel.id IS NOT NULL) AS picked
       FROM photos p LEFT JOIN selects sel ON sel.photo_id = p.id
      WHERE p.shoot_id = $1 ORDER BY p.sort, p.id`,
    [s.id],
  );
  const picked = photos.filter((p) => p.picked).length;

  return (
    <>
      <p className="eyebrow">{s.studio_name}</p>
      <h1>{s.title}</h1>
      <p className="lede">
        {KIND_LABEL[s.kind as keyof typeof KIND_LABEL] ?? s.kind} · {formatDate(s.shoot_date)}
        <br />
        Star the ones you want. {picked === 0
          ? 'Nothing picked yet.'
          : `${picked} picked so far — your photographer can already see them.`}
      </p>

      {photos.length === 0 ? (
        <p className="empty">The gallery is not ready yet. Your photographer is still working.</p>
      ) : (
        <ul className="sheet sheet--proof" style={{ marginTop: '1.6rem' }}>
          {photos.map((p) => (
            <li className={p.picked ? 'plate plate--picked' : 'plate'} key={p.id}>
              <img src={p.url} alt={p.caption} loading="lazy" />
              <div className="plate__cap">
                <span>{p.caption || 'Untitled'}</span>
                <form action={toggleSelectAction}>
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="photoId" value={p.id} />
                  <button
                    className={p.picked ? 'star star--on' : 'star'}
                    type="submit"
                    aria-label={p.picked ? `Unpick ${p.caption || 'this frame'}` : `Pick ${p.caption || 'this frame'}`}
                  >
                    {p.picked ? '★' : '☆'}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="note" style={{ marginTop: '1.6rem' }}>
        Picks save as you go — there is nothing to submit, and you can change your mind.
      </p>
    </>
  );
}
