import { useEffect, useState } from "react";
import Auth from "./Components/Auth";
import ExpenseList from "./Components/ExpenseList";
import AddExpense from "./Components/AddExpense";
import Overview from "./Components/Overview";
import Settings from "./Components/Settings";
import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { ensureHome } from "./ensureHome";
import { useI18n } from "./i18n";
import "./App.css";
import "./budget.css";
import "./tabs.css";

function App() {
  const [user, loading] = useAuthState(auth);
  const [home, setHome] = useState(null);
  const [homeError, setHomeError] = useState("");
  const [tab, setTab] = useState("overview");
  const { t } = useI18n();

  useEffect(() => {
    if (!user) {
      setHome(null);
      setHomeError("");
      return;
    }

    let cancelled = false;
    ensureHome(user)
      .then((nextHome) => {
        if (!cancelled) setHome(nextHome);
      })
      .catch((error) => {
        console.error("Could not open home:", error);
        if (!cancelled) setHomeError(t.homeError);
      });

    return () => {
      cancelled = true;
    };
  }, [user, t.homeError]);

  if (loading || (user && !home && !homeError)) {
    return <p className="app-status">{t.opening}</p>;
  }

  if (!user) return <Auth />;

  if (homeError) {
    return <p className="app-status app-status-error">{homeError}</p>;
  }

  const tabs = [
    ["overview", t.navOverview],
    ["month", t.navMonth],
    ["settings", t.navSettings],
  ];

  return (
    <div className="app-shell">
      <div className="budget">
        <nav className="tabs">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>

        {tab === "overview" ? <Overview homeId={home.id} homeName={home.name} /> : null}
        {tab === "month" ? (
          <>
            <AddExpense homeId={home.id} />
            <ExpenseList homeId={home.id} />
          </>
        ) : null}
        {tab === "settings" ? (
          <Settings
            homeId={home.id}
            homeName={home.name}
            onRename={(name) => setHome({ ...home, name })}
          />
        ) : null}
      </div>
    </div>
  );
}

export default App;
