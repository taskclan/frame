import { AI_LEAK } from '@/lib/images';
import { signUpAction } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default function SignUpPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <section className="panel panel--dressed" style={{ ['--leak' as string]: `url(${AI_LEAK})` } as React.CSSProperties}>
      <p className="eyebrow">One studio, shared</p>
      <h1>Open a studio</h1>
      <p className="lede">You get a six-letter code. Whoever shoots with you joins on it.</p>
      {searchParams.error ? <p className="error" style={{ marginTop: '1rem' }}>{searchParams.error}</p> : null}
      <form action={signUpAction}>
        <div className="fields">
          <label>Studio name<input name="studioName" placeholder="Halide Studio" required /></label>
          <label>Your name<input name="name" placeholder="optional" /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        </div>
        <button className="btn" type="submit">Open it</button>
      </form>
    </section>
  );
}
