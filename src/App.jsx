import Auth from "./Components/Auth";
import ExpenseList from "./Components/ExpenseList";
import AddExpense from "./Components/AddExpense";
import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import "./App.css";

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="container">
      {!user ? <Auth /> : <>
        <AddExpense />
        <ExpenseList />
      </>}
    </div>
  );
}

export default App;
