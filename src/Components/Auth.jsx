import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { LangSwitch, useI18n } from "../i18n";
import "./Auth.css";

function CardArt({ id }) {
  if (id === "tx") {
    return (
      <div className="art art-tx" aria-hidden="true">
        <div className="row"><i /><b /></div>
        <div className="row"><i /><b /></div>
        <div className="row"><i /><b /></div>
        <div className="row"><i /><b /></div>
      </div>
    );
  }
  if (id === "bal") {
    return (
      <div className="art art-bal" aria-hidden="true">
        <span className="num">+4 280</span>
        <span className="hint">SEK</span>
      </div>
    );
  }
  if (id === "bud") {
    return (
      <div className="art art-bud" aria-hidden="true">
        <div className="bar"><span style={{ width: "72%" }} /></div>
        <div className="bar"><span style={{ width: "48%" }} /></div>
        <div className="bar"><span style={{ width: "86%" }} /></div>
      </div>
    );
  }
  return (
    <div className="art art-rep" aria-hidden="true">
      <span style={{ height: "42%" }} />
      <span style={{ height: "68%" }} />
      <span style={{ height: "50%" }} />
      <span style={{ height: "84%" }} />
      <span style={{ height: "60%" }} />
    </div>
  );
}

function Auth() {
  const { t } = useI18n();

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="hero-page">
      <LangSwitch />

      <header className="hero-head">
        <p className="brand">HomeBudget</p>
        <h1>
          {t.headline}
          <br />
          {t.headline2}
        </h1>
        <p className="sub">{t.sub}</p>
      </header>

      <div className="fan" role="list">
        {t.cards.map((card) => (
          <article key={card.id} className={`pillar pillar-${card.id}`} role="listitem">
            <CardArt id={card.id} />
            <div className="pillar-copy">
              <span className="kicker">{card.kicker}</span>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="cta">
        <button onClick={loginWithGoogle} className="google-btn">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          {t.login}
        </button>
        <p className="trust">{t.trust}</p>
      </div>
    </div>
  );
}

export default Auth;
