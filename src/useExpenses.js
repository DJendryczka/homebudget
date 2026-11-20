import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

function toLocalDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Live list of the home's transactions, newest first.
// App only renders this once the user is logged in and approved,
// so no separate auth listener is needed here.
export function useExpenses(homeId) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!homeId) return undefined;

    return onSnapshot(
      collection(db, "homes", homeId, "expenses"),
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const date = toLocalDate(data.date || data.createdAt);
          return {
            id: docSnap.id,
            description: data.description || "Unknown",
            amount: Number(data.amount) || 0,
            category: data.category || "Other",
            type: data.type || "expense",
            date,
            monthKey: date.slice(0, 7),
            year: date.slice(0, 4),
            recurringId: data.recurringId || null,
          };
        });
        next.sort((a, b) => b.date.localeCompare(a.date));
        setItems(next);
      },
      (error) => console.error("Could not load transactions:", error)
    );
  }, [homeId]);

  return { items };
}
