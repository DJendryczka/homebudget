import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

function AddExpense() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    await addDoc(collection(db, "expenses"), {
      description,
      amount: parseFloat(amount),
      createdAt: new Date(),
    });

    setDescription("");
    setAmount("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
      <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Amount" />
      <button type="submit">Add Expense</button>
    </form>
  );
}

export default AddExpense;
