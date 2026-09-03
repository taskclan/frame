import { AI_LEAK } from '@/lib/images';
import { signInAction } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default function SignInPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <section className="panel panel--dressed" style={{ ['--leak' as string]: `url(${AI_LEAK})` } as React.CSSProperties}>
      <p className="eyebrow">Welcome back</p>
      <h1>Sign in</h1>
      {searchParams.error ? <p className="error" style={{ marginTop: '1rem' }}>{searchParams.error}</p> : null}
      <form action={signInAction}>
        <div className="fields">
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        </div>
        <button className="btn" type="submit">Sign in</button>
      </form>
      <p className="note" style={{ marginTop: '1.4rem' }}>
        New here? <a href="/signup">Open a studio</a>. Got a code? <a href="/join">Join one</a>.
      </p>
    </section>
  );
}
