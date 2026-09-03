import { redirect } from 'next/navigation';
import { currentStudio } from '@/lib/current';
import { query } from '@/lib/db';
import { formatPence } from '@/lib/money';
import { addClientAction, deleteClientAction } from '@/app/studio-actions';

export const dynamic = 'force-dynamic';

type Client = { id: number; name: string; email: string; shoots: string; billed: string | null };

export default async function ClientsPage() {
  const ctx = await currentStudio();
  if (!ctx) redirect('/signin');

  const clients = await query<Client>(
    `SELECT c.id, c.name, c.email,
            COUNT(s.id)::text AS shoots,
            SUM(s.fee_pence)::text AS billed
       FROM clients c LEFT JOIN shoots s ON s.client_id = c.id
      WHERE c.studio_id = $1 GROUP BY c.id ORDER BY c.name`,
    [ctx!.studio.id],
  );

  return (
    <>
      <p className="eyebrow">Clients</p>
      <h1>{clients.length === 0 ? 'No clients yet' : `${clients.length} on the books`}</h1>

      <form className="addform" autoComplete="off" action={addClientAction}>
        <label>Name<input name="name" placeholder="Aria Whitfield" required /></label>
        <label>Email<input name="email" type="email" placeholder="optional" /></label>
        <button className="btn" type="submit">Add client</button>
      </form>

      {clients.length === 0 ? (
        <p className="empty">Add whoever the shoot is for.</p>
      ) : (
        <ul className="list">
          {clients.map((c) => (
            <li className="row" key={c.id}>
              <div className="row__main">
                <div className="row__title">{c.name}</div>
                {c.email ? <div className="row__sub">{c.email}</div> : null}
              </div>
              <span className="note">{c.shoots} shoot{c.shoots === '1' ? '' : 's'}</span>
              {Number(c.billed ?? 0) > 0 ? <span className="note money">{formatPence(Number(c.billed))}</span> : null}
              <form action={deleteClientAction}>
                <input type="hidden" name="id" value={c.id} />
                <button className="btn btn--quiet btn--small" type="submit">Remove</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
