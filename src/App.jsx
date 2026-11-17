import { useEffect, useState } from "react";
import Auth from "./Components/Auth";
import ExpenseList from "./Components/ExpenseList";
import AddExpense from "./Components/AddExpense";
import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { ensureHome } from "./ensureHome";
import "./App.css";

function App() {
  const [user, loading] = useAuthState(auth);
  const [home, setHome] = useState(null);
  const [homeError, setHomeError] = useState("");

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
        if (!cancelled) setHomeError("Could not open your home. Check Firestore rules.");
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || (user && !home && !homeError)) {
    return <p className="text-center mt-5">Opening your home…</p>;
  }

  if (!user) return <Auth />;

  if (homeError) {
    return <p className="text-center mt-5 text-danger">{homeError}</p>;
  }

  return (
    <div className="container-fluid m-0 p-0">
      <AddExpense homeId={home.id} />
      <ExpenseList homeId={home.id} homeName={home.name} />
    </div>
  );
}

export default App;
