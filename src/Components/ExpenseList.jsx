import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const expensesRef = collection(db, "expenses");

    // Listen to Firestore in real-time
    const unsubscribe = onSnapshot(expensesRef, (snapshot) => {
      const expenseData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expenseData);
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // Logout Function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div>
      <h2>Expenses</h2>
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
      <ul>
        {expenses.map(exp => (
          <li key={exp.id}>
            {exp.description}: ${exp.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExpenseList;
