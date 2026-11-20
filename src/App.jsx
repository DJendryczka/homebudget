import { useEffect, useState } from "react";
import { useOnline } from "./useOnline";
import Auth from "./Components/Auth";
import ExpenseList from "./Components/ExpenseList";
import AddExpense from "./Components/AddExpense";
import BankImport from "./Components/BankImport";
import Overview from "./Components/Overview";
import Settings from "./Components/Settings";
import AdminPanel from "./Components/AdminPanel";
import Waiting from "./Components/Waiting";
import { auth, db } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { ensureHome } from "./ensureHome";
import { isSuperAdmin } from "./admin";
import { useI18n } from "./i18n";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import "./App.css";
import "./budget.css";
import "./tabs.css";
import "./admin.css";

function App() {
  const [user, loading] = useAuthState(auth);
  const [home, setHome] = useState(null);
  const [homeError, setHomeError] = useState("");
  const [access, setAccess] = useState(null);
  const [tab, setTab] = useState("overview");
  const { t } = useI18n();
  const admin = isSuperAdmin(user);
  const online = useOnline();

  useEffect(() => {
    if (!user || admin) {
      setAccess(admin ? "approved" : null);
      return undefined;
    }

    const ref = doc(db, "accessRequests", user.uid);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setDoc(
          ref,
          {
            email: user.email || "",
            name: user.displayName || "",
            status: "pending",
            requestedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch((error) => console.error("Could not record access request:", error));
        setAccess("pending");
        return;
      }
      setAccess(snap.data().status || "pending");
    });
  }, [user, admin]);

  useEffect(() => {
    if (!user || access !== "approved") {
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
  }, [user, access, t.homeError]);

  if (loading || (user && access === null)) {
    return <p className="app-status">{t.opening}</p>;
  }

  if (!user) return <Auth />;

  if (access !== "approved") {
    return <Waiting status={access} />;
  }

  if (homeError) {
    return <p className="app-status app-status-error">{homeError}</p>;
  }

  if (!home) {
    return <p className="app-status">{t.opening}</p>;
  }

  const tabs = [
    ["overview", t.navOverview],
    ["month", t.navMonth],
    ["settings", t.navSettings],
  ];
  if (admin) tabs.push(["admin", t.navAdmin]);

  return (
    <div className="app-shell">
      <div className="budget">
        {!online ? (
          <p className="offline-bar" role="status">
            {t.offline}
          </p>
        ) : null}
        <nav className="tabs">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>

        {tab === "overview" ? (
          <Overview homeId={home.id} homeName={home.name} budgets={home.budgets || {}} />
        ) : null}
        {tab === "month" ? (
          <>
            <AddExpense homeId={home.id} />
            <BankImport homeId={home.id} />
            <ExpenseList homeId={home.id} budgets={home.budgets || {}} />
          </>
        ) : null}
        {tab === "settings" ? (
          <Settings
            homeId={home.id}
            homeName={home.name}
            budgets={home.budgets || {}}
            onRename={(name) => setHome({ ...home, name })}
            onBudgets={(budgets) => setHome({ ...home, budgets })}
          />
        ) : null}
        {tab === "admin" && admin ? <AdminPanel /> : null}
      </div>
    </div>
  );
}

export default App;
