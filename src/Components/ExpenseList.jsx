import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useI18n } from "../i18n";
import { useExpenses } from "../useExpenses";
import { useState } from "react";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function ExpenseList({ homeId }) {
  const { t } = useI18n();
  const { items, user } = useExpenses(homeId);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const grouped = items.reduce((groups, item) => {
    if (!groups[item.monthKey]) groups[item.monthKey] = [];
    groups[item.monthKey].push(item);
    return groups;
  }, {});

  const monthOptions = [...new Set([...Object.keys(grouped), selectedMonth])].sort((a, b) => b.localeCompare(a));
  const currentExpenses = grouped[selectedMonth] || [];
  const totalIncome = currentExpenses.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = currentExpenses.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleDelete = async (id) => {
    if (!user || !homeId || !window.confirm(t.deleteConfirm)) return;
    try {
      await deleteDoc(doc(db, "homes", homeId, "expenses", id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <section className="panel">
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
        <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
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
                  <button className="danger" type="button" onClick={() => handleDelete(exp.id)}>
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
