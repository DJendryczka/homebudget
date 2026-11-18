import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";

function toLocalDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useExpenses(homeId) {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    return auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser || null);
    });
  }, []);

  useEffect(() => {
    if (!user || !homeId) return undefined;

    return onSnapshot(collection(db, "homes", homeId, "expenses"), (snapshot) => {
      setItems(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const date = toLocalDate(data.createdAt);
          return {
            id: docSnap.id,
            description: data.description || "Unknown",
            amount: Number(data.amount) || 0,
            category: data.category || "Other",
            type: data.type || "expense",
            date,
            monthKey: date.slice(0, 7),
            year: date.slice(0, 4),
          };
        })
      );
    });
  }, [user, homeId]);

  return { items, user };
}
