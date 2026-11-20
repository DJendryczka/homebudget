import { useState } from "react";
import { arrayUnion, collection, doc, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useI18n } from "../i18n";
import { dateInMonth, dueInMonth } from "../useRecurring";
import { LOCALES, amountForInput, parseAmount } from "../format";
import "../recurring.css";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Month tab: recurring items not yet added this month. You can adjust the amount
// and add them one at a time or all at once, or skip one for this month.
function RecurringDue({ homeId, monthKey, recurring, items }) {
  const { lang, t } = useI18n();
  const [amounts, setAmounts] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Only the current month and earlier – not next month in advance.
  if (monthKey > currentMonth()) return null;

  const due = dueInMonth(recurring, items, monthKey);
  if (due.length === 0) return null;

  const shortDate = (iso) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(LOCALES[lang], { day: "numeric", month: "short" });

  const amountText = (entry) => amounts[entry.id] ?? amountForInput(entry.amount, lang);

  const add = async (entries) => {
    if (busy || !auth.currentUser) return;

    const values = entries.map((entry) => parseAmount(amountText(entry)));
    if (values.some((value) => value === null)) {
      setError(t.invalidAmount);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const batch = writeBatch(db);
      entries.forEach((entry, index) => {
        batch.set(doc(collection(db, "homes", homeId, "expenses")), {
          description: entry.description,
          amount: values[index],
          category: entry.category,
          type: entry.type,
          date: dateInMonth(monthKey, entry.day),
          createdAt: new Date(),
          createdBy: auth.currentUser.uid,
          recurringId: entry.id,
        });
      });
      await batch.commit();
    } catch (err) {
      console.error("Could not add recurring transactions:", err);
      setError(t.addError);
    }
    setBusy(false);
  };

  const skip = async (entry) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await updateDoc(doc(db, "homes", homeId, "recurring", entry.id), {
        skippedMonths: arrayUnion(monthKey),
      });
    } catch (err) {
      console.error("Could not skip recurring transaction:", err);
      setError(t.recurringError);
    }
    setBusy(false);
  };

  return (
    <div className="due">
      <div className="due-head">
        <div>
          <h3>
            {t.dueTitle} <span className="due-count">{due.length}</span>
          </h3>
          <p>{t.dueHint}</p>
        </div>
        {due.length > 1 ? (
          <button type="button" className="primary" disabled={busy} onClick={() => add(due)}>
            {t.addAll}
          </button>
        ) : null}
      </div>

      <ul className="due-list">
        {due.map((entry) => (
          <li key={entry.id}>
            <div className="recurring-main">
              <strong>{entry.description}</strong>
              <span>
                {t.categories[entry.category] || entry.category} · {shortDate(dateInMonth(monthKey, entry.day))}
              </span>
            </div>
            <label className={`due-amount ${entry.type === "income" ? "money-in" : "money-out"}`}>
              <span aria-hidden="true">{entry.type === "income" ? "+" : "−"}</span>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                aria-label={`${t.amount}: ${entry.description}`}
                value={amountText(entry)}
                onChange={(event) => {
                  setAmounts({ ...amounts, [entry.id]: event.target.value });
                  if (error) setError("");
                }}
              />
            </label>
            <div className="row-actions">
              <button type="button" className="primary small" disabled={busy} onClick={() => add([entry])}>
                {t.add}
              </button>
              <button type="button" className="quiet" disabled={busy} onClick={() => skip(entry)}>
                {t.skip}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default RecurringDue;
