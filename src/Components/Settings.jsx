import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { LangSwitch, useI18n } from "../i18n";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function Settings({ homeId, homeName, onRename }) {
  const { t } = useI18n();
  const [name, setName] = useState(homeName && homeName !== "Home" ? homeName : "");
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (status === "saving") return;
    setName(homeName && homeName !== "Home" ? homeName : "");
  }, [homeName, status]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => {
      setNotice("");
      setStatus("idle");
    }, 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const closeNotice = () => {
    setNotice("");
    setStatus("idle");
  };

  const saveName = async (event) => {
    event.preventDefault();
    const next = name.trim();
    if (!next || status === "saving") return;

    setStatus("saving");
    setNotice("");
    const started = Date.now();
    let ok = false;

    try {
      await setDoc(doc(db, "homes", homeId), { name: next }, { merge: true });
      onRename(next);
      ok = true;
    } catch (error) {
      console.error("Could not save home name:", error);
    }

    await wait(Math.max(0, 2000 - (Date.now() - started)));
    setStatus(ok ? "success" : "error");
    setNotice(ok ? t.saved : t.saveError);
  };

  return (
    <section className="panel settings">
      <h2>{t.navSettings}</h2>

      <div className="setting">
        <p>{t.language}</p>
        <LangSwitch variant="inline" />
      </div>

      <form className="setting" onSubmit={saveName}>
        <label htmlFor="home-name">{t.homeName}</label>
        <div className="name-row">
          <input
            id="home-name"
            value={name}
            placeholder={t.home}
            disabled={status === "saving"}
            onChange={(event) => setName(event.target.value)}
          />
          <button type="submit" className={status} disabled={status === "saving"}>
            {status === "saving" ? t.saving : t.save}
          </button>
        </div>
      </form>

      <button
        className="logout"
        type="button"
        onClick={() => {
          signOut(auth).catch((error) => console.error("Logout failed:", error));
        }}
      >
        {t.logout}
      </button>

      {status === "saving"
        ? createPortal(
            <div className="save-overlay">
              <div className="spinner" />
            </div>,
            document.body
          )
        : null}

      {notice
        ? createPortal(
            <div className="save-overlay" onClick={closeNotice}>
              <div className={`save-notice ${status}`} role="status" onClick={(event) => event.stopPropagation()}>
                <p>{notice}</p>
                <button type="button" onClick={closeNotice}>
                  OK
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}

export default Settings;
