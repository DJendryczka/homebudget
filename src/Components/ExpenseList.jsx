import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";

function ExpenseList() {
  // Helper: Get Current Month (YYYY-MM)
  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  // State for grouped expenses, selected month, and the logged-in user.
  const [expenses, setExpenses] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [user, setUser] = useState(null);

  // Listen to auth state changes.
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen to expenses from the correct collection once the user is set.
  useEffect(() => {
    if (!user) return;
    // Use the same path as your working JS code.
    const expensesRef = collection(db, "users", user.uid, "expenses");

    const unsubscribe = onSnapshot(
      expensesRef,
      (snapshot) => {
        const expenseData = snapshot.docs.map((doc) => {
          const data = doc.data();

          // Convert createdAt to a Date.
          let dateObj;
          if (data.createdAt && data.createdAt.toDate) {
            dateObj = data.createdAt.toDate();
          } else if (data.createdAt) {
            dateObj = new Date(data.createdAt);
          } else {
            dateObj = new Date(); // Fallback if missing.
          }
          const formattedDate = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
          const monthKey = formattedDate.substring(0, 7); // YYYY-MM

          return {
            id: doc.id,
            description: data.description || "Unknown",
            amount: data.amount || 0,
            date: formattedDate,
            monthKey,
          };
        });

        // Group expenses by month (YYYY-MM)
        const groupedExpenses = expenseData.reduce((acc, expense) => {
          if (!acc[expense.monthKey]) acc[expense.monthKey] = [];
          acc[expense.monthKey].push(expense);
          return acc;
        }, {});
        setExpenses(groupedExpenses);
      },
      (error) => {
        console.error("Error fetching expenses:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Ensure the month selector always shows the selected/current month even if there is no data.
  const monthOptions = [
    ...new Set([...Object.keys(expenses), selectedMonth]),
  ].sort((a, b) => b.localeCompare(a));

  // Logout handler.
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center">Expenses</h2>
      <button className="btn btn-danger mb-3" onClick={handleLogout}>
        Logout
      </button>

      {/* Month Selector */}
      <div className="mb-3">
        <label className="me-2">Select Month:</label>
        <select
          className="form-select w-auto d-inline-block"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      {expenses[selectedMonth] && expenses[selectedMonth].length > 0 ? (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount ($)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {expenses[selectedMonth].map((exp) => (
              <tr key={exp.id}>
                <td>{exp.description}</td>
                <td>${exp.amount.toFixed(2)}</td>
                <td>{exp.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center">No expenses found for {selectedMonth}.</p>
      )}
    </div>
  );
}

export default ExpenseList;
