import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { LangSwitch, useI18n } from "../i18n";

function ExpenseList({ homeId, homeName }) {
  const { t } = useI18n();

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
    if (!user || !homeId || !window.confirm(t.deleteConfirm)) return;
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
  const shownHome = !homeName || homeName === "Home" ? t.home : homeName;

  return (
    <section className="budget panel">
      <div className="panel-head">
        <div>
          <h2>{t.transactions}</h2>
          <p className="home-label">{shownHome}</p>
        </div>
        <div className="panel-actions">
          <LangSwitch variant="inline" />
          <button className="logout" onClick={handleLogout}>
            {t.logout}
          </button>
        </div>
      </div>

      <div className="totals">
        <div className="total total-in">
          <span>{t.income}</span>
          <strong>{totalIncome.toFixed(2)}</strong>
        </div>
        <div className="total total-out">
          <span>{t.expenses}</span>
          <strong>{totalExpense.toFixed(2)}</strong>
        </div>
        <div className={`total ${balance >= 0 ? "total-ok" : "total-bad"}`}>
          <span>{t.balance}</span>
          <strong>{balance.toFixed(2)}</strong>
        </div>
      </div>

      <label className="month">
        {t.month}
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </label>

      {currentExpenses.length > 0 ? (
        <table className="sheet">
          <thead>
            <tr>
              <th>{t.date}</th>
              <th>{t.description}</th>
              <th>{t.category}</th>
              <th>{t.type}</th>
              <th>{t.amount}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {currentExpenses.map((exp) => (
              <tr key={exp.id}>
                <td>{exp.date}</td>
                <td>{exp.description}</td>
                <td>{t.categories[exp.category] || exp.category}</td>
                <td>
                  <span className={`tag ${exp.type === "income" ? "tag-in" : "tag-out"}`}>
                    {exp.type === "income" ? t.income : t.expense}
                  </span>
                </td>
                <td className={exp.type === "income" ? "money-in" : "money-out"}>
                  {exp.type === "income" ? "+" : "−"}
                  {exp.amount.toFixed(2)}
                </td>
                <td>
                  <button className="danger" onClick={() => handleDelete(exp.id)}>
                    {t.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty">
          {t.empty} {selectedMonth}.
        </p>
      )}
    </section>
  );
}

export default ExpenseList;
