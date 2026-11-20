import { useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useI18n } from "../i18n";
import { CATEGORY_KEYS } from "../categories";


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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !date || !auth.currentUser || !homeId) return;

    await addDoc(collection(db, "homes", homeId, "expenses"), {
      description,
      amount: parseFloat(amount),
      category,
      type,
      date,
      createdAt: new Date(),
      createdBy: auth.currentUser.uid,
    });

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
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          step="0.01"
          placeholder={t.amount}
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
        <button type="submit">{t.add}</button>
      </div>
    </form>
  );
}

export default AddExpense;
