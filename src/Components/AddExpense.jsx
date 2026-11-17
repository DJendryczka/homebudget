import { useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const CATEGORIES = ["Food", "Transport", "Housing", "Entertainment", "Health", "Salary", "Other"];

function AddExpense({ homeId }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [type, setType] = useState("expense");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !auth.currentUser || !homeId) return;

    await addDoc(collection(db, "homes", homeId, "expenses"), {
      description,
      amount: parseFloat(amount),
      category,
      type,
      createdAt: new Date(),
      createdBy: auth.currentUser.uid,
    });

    setDescription("");
    setAmount("");
    setCategory("Other");
    setType("expense");
  };

  return (
    <form onSubmit={handleSubmit} className="budget entry">
      <h2>Add transaction</h2>
      <p>Income and expenses for this home.</p>
      <div className="entry-grid">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          required
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          step="0.01"
          placeholder="Amount"
          required
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <button type="submit">Add</button>
      </div>
    </form>
  );
}

export default AddExpense;
