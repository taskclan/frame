import '../globals.css';
import '../studio.css';
import '../landing.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your gallery',
  // A client's gallery is not a page that wants to be found.
  robots: { index: false, follow: false },
};

/**
 * The shell a client sees, and only a client.
 *
 * Deliberately not the studio's chrome. Somebody opening a link to their own
 * wedding photographs should not be shown "Open a studio" and "Join one" —
 * that is marketing aimed at a photographer, on a page belonging to their
 * customer. The header is set by the page itself, because only it knows whose
 * studio this is.
 */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <main style={{ paddingTop: '2.6rem' }}>{children}</main>
          <footer className="colophon">Made with Frame.</footer>
        </div>
      </body>
    </html>
  );
}
