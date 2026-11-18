import { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useI18n } from "../i18n";
import { useExpenses } from "../useExpenses";
import "./../edit-row.css";
import "../budget-ui.css";

const CATEGORY_KEYS = [
  "Food",
  "Sweets",
  "Phone",
  "Restaurant",
  "Transport",
  "Housing",
  "Credit",
  "Electricity",
  "Internet",
  "Subscriptions",
  "Clothes",
  "Health",
  "Kids",
  "Insurance",
  "Entertainment",
  "Gifts",
  "Pets",
  "Salary",
  "Other",
];

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function EditRow({ exp, onCancel, onSave }) {
  const { t } = useI18n();
  const [description, setDescription] = useState(exp.description);
  const [amount, setAmount] = useState(String(exp.amount));
  const [category, setCategory] = useState(exp.category);
  const [type, setType] = useState(exp.type);
  const [date, setDate] = useState(exp.date);
  const options = CATEGORY_KEYS.includes(category) ? CATEGORY_KEYS : [category, ...CATEGORY_KEYS];

  return (
    <tr className="edit-row">
      <td>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
      </td>
      <td>
        <input value={description} onChange={(event) => setDescription(event.target.value)} required />
      </td>
      <td>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {options.map((key) => (
            <option key={key} value={key}>
              {t.categories[key] || key}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="expense">{t.expense}</option>
          <option value="income">{t.income}</option>
        </select>
      </td>
      <td>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
      </td>
      <td>
        <div className="row-actions">
          <button
            className="quiet"
            type="button"
            onClick={() =>
              onSave({
                description: description.trim(),
                amount: Number(amount),
                category,
                type,
                date,
              })
            }
          >
            {t.save}
          </button>
          <button className="danger" type="button" onClick={onCancel}>
            {t.cancel}
          </button>
        </div>
      </td>
    </tr>
  );
}

function ExpenseList({ homeId, budgets = {} }) {
  const { t } = useI18n();
  const { items, user } = useExpenses(homeId);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [editingId, setEditingId] = useState(null);

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

  const spentByCategory = currentExpenses
    .filter((item) => item.type === "expense")
    .reduce((groups, item) => {
      groups[item.category] = (groups[item.category] || 0) + item.amount;
      return groups;
    }, {});
  const budgetRows = Object.entries(budgets)
    .filter(([, limit]) => Number(limit) > 0)
    .map(([key, limit]) => ({
      key,
      limit: Number(limit),
      spent: spentByCategory[key] || 0,
    }))
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit);

  const handleDelete = async (id) => {
    if (!user || !homeId || !window.confirm(t.deleteConfirm)) return;
    try {
      await deleteDoc(doc(db, "homes", homeId, "expenses", id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleSave = async (id, next) => {
    if (!user || !homeId || !next.description || !next.date || Number.isNaN(next.amount)) return;
    try {
      await updateDoc(doc(db, "homes", homeId, "expenses", id), next);
      setEditingId(null);
    } catch (error) {
      console.error("Update failed:", error);
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

      {budgetRows.length > 0 ? (
        <ul className="budget-bars">
          {budgetRows.map((row) => {
            const share = row.limit > 0 ? Math.round((row.spent / row.limit) * 100) : 0;
            const over = row.spent > row.limit;
            const left = row.limit - row.spent;
            return (
              <li key={row.key}>
                <div className="cat-row">
                  <span>{t.categories[row.key] || row.key}</span>
                  <strong className={over ? "money-out" : "budget-meta"}>
                    {row.spent.toFixed(0)} / {row.limit.toFixed(0)} · {over ? t.over : `${left.toFixed(0)} ${t.remaining}`}
                  </strong>
                </div>
                <div className={`cat-track ${over ? "over" : "ok"}`}>
                  <span style={{ width: `${Math.min(share, 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

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
            {currentExpenses.map((exp) =>
              editingId === exp.id ? (
                <EditRow
                  key={exp.id}
                  exp={exp}
                  onCancel={() => setEditingId(null)}
                  onSave={(next) => handleSave(exp.id, next)}
                />
              ) : (
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
                    <div className="row-actions">
                      <button className="quiet" type="button" onClick={() => setEditingId(exp.id)}>
                        {t.edit}
                      </button>
                      <button className="danger" type="button" onClick={() => handleDelete(exp.id)}>
                        {t.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
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
