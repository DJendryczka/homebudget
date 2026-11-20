import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

// Live list of the home's recurring transactions, sorted by day of the month.
export function useRecurring(homeId) {
  const [recurring, setRecurring] = useState([]);

  useEffect(() => {
    if (!homeId) return undefined;

    return onSnapshot(
      collection(db, "homes", homeId, "recurring"),
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            description: data.description || "",
            amount: Number(data.amount) || 0,
            category: data.category || "Other",
            type: data.type || "expense",
            day: Number(data.day) || 1,
            startMonth: data.startMonth || "0000-00",
            skippedMonths: Array.isArray(data.skippedMonths) ? data.skippedMonths : [],
          };
        });
        next.sort((a, b) => a.day - b.day || a.description.localeCompare(b.description));
        setRecurring(next);
      },
      (error) => console.error("Could not load recurring transactions:", error)
    );
  }, [homeId]);

  return { recurring };
}

// "2026-02" + day 31 -> "2026-02-28" (the day is clamped to the month's length).
export function dateInMonth(monthKey, day) {
  const [year, month] = monthKey.split("-").map(Number);
  const last = new Date(year, month, 0).getDate();
  return `${monthKey}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

// Recurring items still waiting to be added in the given month.
export function dueInMonth(recurring, items, monthKey) {
  return recurring.filter(
    (entry) =>
      entry.startMonth <= monthKey &&
      !entry.skippedMonths.includes(monthKey) &&
      !items.some((item) => item.recurringId === entry.id && item.monthKey === monthKey)
  );
}
