import { useState } from "react";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useI18n } from "../i18n";
import { useExpenses } from "../useExpenses";
import { CATEGORY_KEYS } from "../categories";
import { spentByCategory, sumByType } from "../totals";
import { amountForInput, formatMoney, parseAmount } from "../format";
import BudgetBars from "./BudgetBars";
import "./../edit-row.css";
import "../budget-ui.css";
import "../tx-list.css";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function EditRow({ exp, onCancel, onSave }) {
  const { lang, t } = useI18n();
  const [description, setDescription] = useState(exp.description);
  const [amount, setAmount] = useState(amountForInput(exp.amount, lang));
  const [category, setCategory] = useState(exp.category);
  const [type, setType] = useState(exp.type);
  const [date, setDate] = useState(exp.date);
  const [invalid, setInvalid] = useState(false);
  const options = CATEGORY_KEYS.includes(category) ? CATEGORY_KEYS : [category, ...CATEGORY_KEYS];

  const save = () => {
    const value = parseAmount(amount);
    if (value === null || !description.trim() || !date) {
      setInvalid(true);
      return;
    }
    onSave({ description: description.trim(), amount: value, category, type, date });
  };

  return (
    <tr className="edit-row">
      <td className="c-date">
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
      </td>
      <td className="c-desc">
        <input value={description} onChange={(event) => setDescription(event.target.value)} required />
      </td>
      <td className="c-cat">
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {options.map((key) => (
            <option key={key} value={key}>
              {t.categories[key] || key}
            </option>
          ))}
        </select>
      </td>
      <td className="c-type">
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="expense">{t.expense}</option>
          <option value="income">{t.income}</option>
        </select>
      </td>
      <td className="c-amount">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          aria-invalid={invalid}
          onChange={(event) => {
            setAmount(event.target.value);
            setInvalid(false);
          }}
          required
        />
      </td>
      <td className="c-actions">
        {invalid ? <span className="form-error">{t.invalidAmount}</span> : null}
        <div className="row-actions">
          <button className="quiet" type="button" onClick={save}>
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
  const { lang, t } = useI18n();
  const { items } = useExpenses(homeId);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

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
  const money = (value) => formatMoney(value, lang, { currency: true });

  const handleDelete = async (id) => {
    if (!homeId || !window.confirm(t.deleteConfirm)) return;
    setError("");
    try {
      await deleteDoc(doc(db, "homes", homeId, "expenses", id));
    } catch (err) {
      console.error("Delete failed:", err);
      setError(t.deleteError);
    }
  };

  const handleSave = async (id, next) => {
    if (!homeId) return;
    setError("");
    try {
      await updateDoc(doc(db, "homes", homeId, "expenses", id), next);
      setEditingId(null);
    } catch (err) {
      console.error("Update failed:", err);
      setError(t.updateError);
    }
  };

  return (
    <section className="panel">
      <div className="totals">
        <div className="total total-in">
          <span>{t.income}</span>
          <strong>{money(totalIncome)}</strong>
        </div>
        <div className="total total-out">
          <span>{t.expenses}</span>
          <strong>{money(totalExpense)}</strong>
        </div>
        <div className={`total ${balance >= 0 ? "total-ok" : "total-bad"}`}>
          <span>{t.balance}</span>
          <strong>{money(balance)}</strong>
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

      {error ? (
        <p className="form-error list-error" role="alert">
          {error}
        </p>
      ) : null}

      {currentExpenses.length > 0 ? (
        <table className="sheet tx-list">
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
                  <td className="c-date">{exp.date}</td>
                  <td className="c-desc">{exp.description}</td>
                  <td className="c-cat">{t.categories[exp.category] || exp.category}</td>
                  <td className="c-type">
                    <span className={`tag ${exp.type === "income" ? "tag-in" : "tag-out"}`}>
                      {exp.type === "income" ? t.income : t.expense}
                    </span>
                  </td>
                  <td className={`c-amount ${exp.type === "income" ? "money-in" : "money-out"}`}>
                    {exp.type === "income" ? "+" : "−"}
                    {money(exp.amount)}
                  </td>
                  <td className="c-actions">
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
