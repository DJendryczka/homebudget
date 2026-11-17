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
    <form onSubmit={handleSubmit} className="p-3 border rounded mb-4 bg-light">
      <h4 className="mb-3">Add Transaction</h4>
      <div className="row g-2">
        <div className="col-md-4">
          <input
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            required
          />
        </div>
        <div className="col-md-2">
          <input
            className="form-control"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.01"
            placeholder="Amount"
            required
          />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="col-md-1">
          <button type="submit" className="btn btn-primary w-100">
            Add
          </button>
        </div>
      </div>
    </form>
  );
}

export default AddExpense;
