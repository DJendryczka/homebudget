import { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useI18n } from "../i18n";
import { useExpenses } from "../useExpenses";
import { CATEGORY_KEYS } from "../categories";
import { spentByCategory, sumByType } from "../totals";
import BudgetBars from "./BudgetBars";
import "./../edit-row.css";
import "../budget-ui.css";


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
  const { items } = useExpenses(homeId);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [editingId, setEditingId] = useState(null);

  const grouped = items.reduce((groups, item) => {
    if (!groups[item.monthKey]) groups[item.monthKey] = [];
    groups[item.monthKey].push(item);
    return groups;
  }, {});

  const monthOptions = [...new Set([...Object.keys(grouped), selectedMonth])].sort((a, b) => b.localeCompare(a));
  const currentExpenses = grouped[selectedMonth] || [];
  const totalIncome = sumByType(currentExpenses, "income");
  const totalExpense = sumByType(currentExpenses, "expense");
  const balance = totalIncome - totalExpense;

  const handleDelete = async (id) => {
    if (!homeId || !window.confirm(t.deleteConfirm)) return;
    try {
      await deleteDoc(doc(db, "homes", homeId, "expenses", id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleSave = async (id, next) => {
    if (!homeId || !next.description || !next.date || Number.isNaN(next.amount)) return;
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

      <BudgetBars budgets={budgets} spent={spentByCategory(currentExpenses)} />

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
