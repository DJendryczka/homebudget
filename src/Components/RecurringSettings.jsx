import { useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useI18n } from "../i18n";
import { CATEGORY_KEYS } from "../categories";
import { useRecurring } from "../useRecurring";
import { amountForInput, formatMoney, parseAmount } from "../format";
import "../recurring.css";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const EMPTY = { description: "", amount: "", category: "Housing", type: "expense", day: "1" };

// Settings: list of recurring transactions + form to add / edit one.
function RecurringSettings({ homeId }) {
  const { lang, t } = useI18n();
  const { recurring } = useRecurring(homeId);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  const set = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    if (error) setError("");
  };

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setError("");
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setError("");
    setForm({
      description: entry.description,
      amount: amountForInput(entry.amount, lang),
      category: entry.category,
      type: entry.type,
      day: String(entry.day),
    });
    // On a phone the form is below the list – scroll to it
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving || !homeId || !auth.currentUser) return;

    const amount = parseAmount(form.amount);
    if (!form.description.trim() || amount === null) {
      setError(t.invalidAmount);
      return;
    }

    const data = {
      description: form.description.trim(),
      amount,
      category: form.category,
      type: form.type,
      day: Number(form.day),
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "homes", homeId, "recurring", editingId), data);
      } else {
        await addDoc(collection(db, "homes", homeId, "recurring"), {
          ...data,
          startMonth: currentMonth(),
          skippedMonths: [],
          createdBy: auth.currentUser.uid,
          createdAt: new Date(),
        });
      }
      reset();
    } catch (err) {
      console.error("Could not save recurring transaction:", err);
      setError(t.recurringError);
    }
    setSaving(false);
  };

  const remove = async (entry) => {
    if (!window.confirm(`${t.delete}: ${entry.description}?`)) return;
    try {
      await deleteDoc(doc(db, "homes", homeId, "recurring", entry.id));
      if (editingId === entry.id) reset();
    } catch (err) {
      console.error("Could not delete recurring transaction:", err);
      setError(t.recurringError);
    }
  };

  return (
    <div className="setting setting-wide recurring">
      <label>{t.recurringTitle}</label>
      <p className="home-label">{t.recurringHint}</p>

      {recurring.length === 0 ? (
        <p className="recurring-empty">{t.recurringEmpty}</p>
      ) : (
        <ul className="recurring-list">
          {recurring.map((entry) => (
            <li key={entry.id} className={editingId === entry.id ? "editing" : ""}>
              <div className="recurring-main">
                <strong>{entry.description}</strong>
                <span>
                  {t.categories[entry.category] || entry.category} · {t.dayLabel} {entry.day}
                </span>
              </div>
              <span className={`recurring-amount ${entry.type === "income" ? "money-in" : "money-out"}`}>
                {entry.type === "income" ? "+" : "−"}
                {formatMoney(entry.amount, lang, { currency: true })}
              </span>
              <div className="row-actions">
                <button type="button" className="quiet" onClick={() => startEdit(entry)}>
                  {t.edit}
                </button>
                <button type="button" className="danger" onClick={() => remove(entry)}>
                  {t.delete}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="recurring-form" onSubmit={save} ref={formRef}>
        <input value={form.description} onChange={set("description")} placeholder={t.description} required />
        <input
          value={form.amount}
          onChange={set("amount")}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={t.amount}
          aria-invalid={error === t.invalidAmount}
          required
        />
        <select value={form.category} onChange={set("category")}>
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>
              {t.categories[key]}
            </option>
          ))}
        </select>
        <select value={form.type} onChange={set("type")}>
          <option value="expense">{t.expense}</option>
          <option value="income">{t.income}</option>
        </select>
        <label className="recurring-day">
          <span>{t.dayOfMonth}</span>
          <select value={form.day} onChange={set("day")}>
            {Array.from({ length: 31 }, (_, index) => (
              <option key={index + 1} value={String(index + 1)}>
                {index + 1}
              </option>
            ))}
          </select>
        </label>
        <div className="recurring-buttons">
          <button type="submit" className="primary" disabled={saving}>
            {editingId ? t.save : t.add}
          </button>
          {editingId ? (
            <button type="button" className="quiet" onClick={reset}>
              {t.cancel}
            </button>
          ) : null}
        </div>
      </form>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default RecurringSettings;
