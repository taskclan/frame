import { AI_LEAK } from '@/lib/images';
import { joinAction } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default function JoinPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <section className="panel panel--dressed" style={{ ['--leak' as string]: `url(${AI_LEAK})` } as React.CSSProperties}>
      <p className="eyebrow">Someone sent you a code</p>
      <h1>Join a studio</h1>
      <p className="lede">You will see the same board, shoots and galleries they do.</p>
      {searchParams.error ? <p className="error" style={{ marginTop: '1rem' }}>{searchParams.error}</p> : null}
      <form action={joinAction}>
        <div className="fields">
          <label>Studio code<input name="code" placeholder="ABC234" required className="code" style={{ textTransform: 'uppercase' }} /></label>
          <label>Your name<input name="name" placeholder="optional" /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        </div>
        <button className="btn" type="submit">Join</button>
      </form>
    </section>
  );
}
