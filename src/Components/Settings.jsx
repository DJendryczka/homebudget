import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { LangSwitch, useI18n } from "../i18n";

function Settings({ homeId, homeName, onRename }) {
  const { t } = useI18n();
  const [name, setName] = useState(homeName && homeName !== "Home" ? homeName : "");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setName(homeName && homeName !== "Home" ? homeName : "");
  }, [homeName]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const saveName = async (event) => {
    event.preventDefault();
    const next = name.trim();
    if (!next) return;
    try {
      await updateDoc(doc(db, "homes", homeId), { name: next });
      onRename(next);
      setToast(t.saved);
    } catch (error) {
      console.error("Could not save home name:", error);
      setToast(t.saveError);
    }
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
            onChange={(event) => setName(event.target.value)}
          />
          <button type="submit">{t.save}</button>
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

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </section>
  );
}

export default Settings;
