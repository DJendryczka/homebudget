import { useEffect, useState } from "react";
import Auth from "./Components/Auth";
import ExpenseList from "./Components/ExpenseList";
import AddExpense from "./Components/AddExpense";
import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { ensureHome } from "./ensureHome";
import { useI18n } from "./i18n";
import "./App.css";
import "./budget.css";

function App() {
  const [user, loading] = useAuthState(auth);
  const [home, setHome] = useState(null);
  const [homeError, setHomeError] = useState("");
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

  return (
    <div className="app-shell">
      <AddExpense homeId={home.id} />
      <ExpenseList homeId={home.id} homeName={home.name} />
    </div>
  );
}

export default App;
