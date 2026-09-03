import { AI_LEAK, HERO, KIT, PORTRAIT, WORKING, shot } from '@/lib/images';

export function Landing() {
  const leak = { ['--leak' as string]: `url(${AI_LEAK})` } as React.CSSProperties;
  return (
    <>
      <section className="land__hero">
        <img className="land__img" src={shot(HERO, 2400)} alt="" />
        <div className="land__copy">
          <p className="land__eyebrow">Frame — for photographers</p>
          <h1 className="land__title">Shoot it. Send it. They pick.</h1>
          <p className="land__sub">
            Book the shoot, work the list, deliver the gallery. Your client stars their
            favourites from a link — no account, no app, no zip file.
          </p>
          <div className="land__ctas">
            <a className="land__cta" href="/signup">Open a studio</a>
            <a className="land__cta land__cta--ghost" href="/join">Join with a code</a>
          </div>
        </div>
      </section>

      <section className="land__section">
        <div className="trip">
          <article className="trip__card">
            <img className="trip__img" src={shot(WORKING, 1200)} alt="" loading="lazy" />
            <div className="trip__body">
              <h3>The day, planned</h3>
              <p>
                Every shoot arrives with a shot list written for its kind — a wedding list
                and a packshot list have nothing in common, so they are not the same list.
              </p>
            </div>
          </article>
          <article className="trip__card">
            <img className="trip__img" src={shot(PORTRAIT, 1200)} alt="" loading="lazy" />
            <div className="trip__body">
              <h3>Selects without the email thread</h3>
              <p>
                Send one link. They star what they want and you see it immediately — instead
                of a reply saying &ldquo;the third one and the one by the window&rdquo;.
              </p>
            </div>
          </article>
          <article className="trip__card">
            <img className="trip__img" src={shot(KIT, 1200)} alt="" loading="lazy" />
            <div className="trip__body">
              <h3>One studio, everyone in it</h3>
              <p>
                A second shooter joins with a code and sees the same board. Whoever is on
                the job can move it along.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="leakband" style={leak}>
        <div>
          <h2>Your work, in front of them in one click.</h2>
          <div className="land__ctas">
            <a className="land__cta" href="/signup">Open a studio</a>
            <a className="land__cta land__cta--ghost" href="/signin">Sign in</a>
          </div>
        </div>
      </section>
    </>
  );
}
