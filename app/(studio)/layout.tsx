import '../globals.css';
import '../studio.css';
import '../landing.css';
import { currentStudio } from '@/lib/current';
import { signOutAction } from '@/app/actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Frame',
  description: 'Shoots, galleries and client selects — for photographers. Book a shoot, work a shot list, deliver a gallery, and let the client star their picks from a link that needs no account.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ctx = await currentStudio().catch(() => null);
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="masthead">
            <a className="brand" href="/">Frame<span>.</span></a>
            <nav className="nav">
              {ctx ? (
                <>
                  <a href="/">Board</a>
                  <a href="/shoots">Shoots</a>
                  <a href="/collections">Collections</a>
                  <a href="/clients">Clients</a>
                  <form action={signOutAction}><button type="submit">Sign out</button></form>
                </>
              ) : (
                <>
                  <a href="/signin">Sign in</a>
                  <a href="/signup">Open a studio</a>
                  <a href="/join">Join one</a>
                </>
              )}
            </nav>
          </header>
          <main>{children}</main>
          <footer className="colophon">
            {ctx
              ? <>{ctx.studio.name} — studio code <span className="code">{ctx.studio.code}</span> for whoever shoots with you.</>
              : <>Frame — made by Taskclan Intelligence. Photography under the Unsplash licence.</>}
          </footer>
        </div>
      </body>
    </html>
  );
}
