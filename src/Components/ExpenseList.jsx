import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

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

  return (
    <div>
      <h2>Expenses</h2>
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
