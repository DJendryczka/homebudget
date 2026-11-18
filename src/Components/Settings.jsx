import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { LangSwitch, useI18n } from "../i18n";

function Settings({ homeId, homeName, onRename }) {
  const { t } = useI18n();
  const [name, setName] = useState(homeName === "Home" ? "" : homeName || "");
  const [saved, setSaved] = useState(false);

  const saveName = async (event) => {
    event.preventDefault();
    const next = name.trim();
    if (!next) return;
    await updateDoc(doc(db, "homes", homeId), { name: next });
    onRename(next);
    setSaved(true);
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
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
          />
          <button type="submit">{t.save}</button>
        </div>
        {saved ? <p className="saved">{t.saved}</p> : null}
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
    </section>
  );
}

export default Settings;
