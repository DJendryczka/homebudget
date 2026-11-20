import { useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useI18n } from "../i18n";
import { CATEGORY_KEYS } from "../categories";
import { parseAmount } from "../format";


function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function AddExpense({ homeId }) {
  const { t } = useI18n();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState("expense");
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || !description.trim() || !date || !auth.currentUser || !homeId) return;

    const value = parseAmount(amount);
    if (value === null) {
      setError(t.invalidAmount);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "homes", homeId, "expenses"), {
        description: description.trim(),
        amount: value,
        category,
        type,
        date,
        createdAt: new Date(),
        createdBy: auth.currentUser.uid,
      });
    } catch (err) {
      console.error("Could not add transaction:", err);
      setError(t.addError);
      setSaving(false);
      return;
    }
    setSaving(false);

    setDescription("");
    setAmount("");
    setCategory("Food");
    setType("expense");
    setDate(today());
  };

  return (
    <form onSubmit={handleSubmit} className="budget entry">
      <h2>{t.addTitle}</h2>
      <p>{t.addHint}</p>
      <div className="entry-grid">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.description}
          required
        />
        <input
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (error) setError("");
          }}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={t.amount}
          aria-invalid={error === t.invalidAmount}
          required
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>
              {t.categories[key]}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">{t.expense}</option>
          <option value="income">{t.income}</option>
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <button type="submit" disabled={saving}>
          {t.add}
        </button>
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export default AddExpense;
