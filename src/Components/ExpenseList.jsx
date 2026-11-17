import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";

function ExpenseList({ homeId, homeName }) {
  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  const [expenses, setExpenses] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !homeId) return;
    const expensesRef = collection(db, "homes", homeId, "expenses");

    const unsubscribe = onSnapshot(expensesRef, (snapshot) => {
      const expenseData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        let dateObj;
        if (data.createdAt && data.createdAt.toDate) {
          dateObj = data.createdAt.toDate();
        } else if (data.createdAt) {
          dateObj = new Date(data.createdAt);
        } else {
          dateObj = new Date();
        }
        const formattedDate = dateObj.toISOString().split("T")[0];
        const monthKey = formattedDate.substring(0, 7);

        return {
          id: docSnap.id,
          description: data.description || "Unknown",
          amount: data.amount || 0,
          category: data.category || "Other",
          type: data.type || "expense",
          date: formattedDate,
          monthKey,
        };
      });

      const groupedExpenses = expenseData.reduce((acc, expense) => {
        if (!acc[expense.monthKey]) acc[expense.monthKey] = [];
        acc[expense.monthKey].push(expense);
        return acc;
      }, {});
      setExpenses(groupedExpenses);
    });

    return () => unsubscribe();
  }, [user, homeId]);

  const handleDelete = async (id) => {
    if (!user || !homeId || !window.confirm("Delete this transaction?")) return;
    try {
      await deleteDoc(doc(db, "homes", homeId, "expenses", id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const monthOptions = [...new Set([...Object.keys(expenses), selectedMonth])].sort((a, b) =>
    b.localeCompare(a)
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const currentExpenses = expenses[selectedMonth] || [];
  const totalIncome = currentExpenses
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = currentExpenses
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-0">Transactions</h2>
          <small className="text-muted">{homeName || "Home"}</small>
        </div>
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <div className="card text-bg-success">
            <div className="card-body py-2">
              <small>Income</small>
              <h5 className="mb-0">${totalIncome.toFixed(2)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-bg-danger">
            <div className="card-body py-2">
              <small>Expenses</small>
              <h5 className="mb-0">${totalExpense.toFixed(2)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className={`card ${balance >= 0 ? "text-bg-primary" : "text-bg-warning"}`}>
            <div className="card-body py-2">
              <small>Balance</small>
              <h5 className="mb-0">${balance.toFixed(2)}</h5>
            </div>
          </div>
        </div>
      </div>

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

      {currentExpenses.length > 0 ? (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {currentExpenses.map((exp) => (
              <tr key={exp.id}>
                <td>{exp.date}</td>
                <td>{exp.description}</td>
                <td>{exp.category}</td>
                <td>
                  <span className={`badge ${exp.type === "income" ? "bg-success" : "bg-danger"}`}>
                    {exp.type}
                  </span>
                </td>
                <td className={exp.type === "income" ? "text-success" : "text-danger"}>
                  {exp.type === "income" ? "+" : "-"}${exp.amount.toFixed(2)}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(exp.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-muted">No transactions found for {selectedMonth}.</p>
      )}
    </div>
  );
}

export default ExpenseList;
