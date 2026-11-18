import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { LangSwitch, useI18n } from "../i18n";
import "../save-notice.css";
import "../budget-ui.css";

const BUDGET_KEYS = [
  "Food",
  "Sweets",
  "Phone",
  "Restaurant",
  "Transport",
  "Housing",
  "Credit",
  "Electricity",
  "Internet",
  "Subscriptions",
  "Clothes",
  "Health",
  "Kids",
  "Insurance",
  "Entertainment",
  "Gifts",
  "Pets",
  "Savings",
  "Pension",
  "Buffer",
  "Account",
  "Other",
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fromBudgets(budgets) {
  return Object.fromEntries(
    BUDGET_KEYS.map((key) => [key, budgets?.[key] ? String(budgets[key]) : ""])
  );
}

function Settings({ homeId, homeName, budgets, onRename, onBudgets }) {
  const { t } = useI18n();
  const [name, setName] = useState(homeName && homeName !== "Home" ? homeName : "");
  const [limits, setLimits] = useState(() => fromBudgets(budgets));
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (status === "saving") return;
    setName(homeName && homeName !== "Home" ? homeName : "");
  }, [homeName, status]);

  useEffect(() => {
    if (status === "saving") return;
    setLimits(fromBudgets(budgets));
  }, [budgets, status]);

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

  const finish = async (started, ok, message) => {
    await wait(Math.max(0, 2000 - (Date.now() - started)));
    setStatus(ok ? "success" : "error");
    setNotice(message);
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

    await finish(started, ok, ok ? t.saved : t.saveError);
  };

  const saveBudgets = async (event) => {
    event.preventDefault();
    if (status === "saving") return;

    const next = {};
    BUDGET_KEYS.forEach((key) => {
      const value = Number(limits[key]);
      if (limits[key] !== "" && !Number.isNaN(value) && value > 0) next[key] = value;
    });

    setStatus("saving");
    setNotice("");
    const started = Date.now();
    let ok = false;

    try {
      await setDoc(doc(db, "homes", homeId), { budgets: next }, { merge: true });
      onBudgets(next);
      ok = true;
    } catch (error) {
      console.error("Could not save budgets:", error);
    }

    await finish(started, ok, ok ? t.budgetsSaved : t.saveError);
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

      <form className="setting setting-wide" onSubmit={saveBudgets}>
        <label>{t.budgets}</label>
        <p className="home-label">{t.budgetHint}</p>
        <div className="budget-form">
          {BUDGET_KEYS.map((key) => (
            <label className="budget-line" key={key}>
              <span>{t.categories[key] || key}</span>
              <input
                type="number"
                min="0"
                step="1"
                value={limits[key] || ""}
                placeholder="0"
                disabled={status === "saving"}
                onChange={(event) => setLimits({ ...limits, [key]: event.target.value })}
              />
            </label>
          ))}
        </div>
        <button type="submit" className={status} disabled={status === "saving"}>
          {status === "saving" ? t.saving : t.save}
        </button>
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
