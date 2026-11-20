import { useMemo, useRef, useState } from "react";
import { collection, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useI18n } from "../i18n";
import { useExpenses } from "../useExpenses";
import { CATEGORY_KEYS } from "../categories";
import { LOCALES, formatMoney } from "../format";
import { decodeFile, markDuplicates, parseBankCsv, suggestCategory } from "../bankImport";
import "../bank-import.css";

const BATCH_SIZE = 400; // Firestore allows max 500 writes per batch

function fill(text, n) {
  return text.replace("{n}", n);
}

// Import of a bank statement (CSV): preview with suggested categories,
// duplicates unchecked, then save in batches. Changed categories are
// remembered on the home (categoryRules) for the next import.
function BankImport({ homeId }) {
  const { lang, t } = useI18n();
  const { items } = useExpenses(homeId);
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [month, setMonth] = useState("all");
  const [learned, setLearned] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { kind: "ok" | "error" | "info", text }
  const [pending, setPending] = useState(0);

  const months = useMemo(
    () => [...new Set(rows.map((row) => row.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a)),
    [rows]
  );
  const visible = month === "all" ? rows : rows.filter((row) => row.date.startsWith(month));
  const selected = visible.filter((row) => row.selected);

  const monthLabel = (key) => {
    const [year, m] = key.split("-").map(Number);
    return new Date(year, m - 1, 1).toLocaleString(LOCALES[lang], { month: "long", year: "numeric" });
  };

  const reset = () => {
    setRows([]);
    setMonth("all");
    setLearned({});
    setNotice(null);
    setPending(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const readFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setNotice(null);
    try {
      const parsed = parseBankCsv(decodeFile(await file.arrayBuffer()));
      if (parsed.error) {
        setRows([]);
        setNotice({ kind: "error", text: t.importBadFile });
        return;
      }

      const homeSnap = await getDoc(doc(db, "homes", homeId));
      const rules = homeSnap.exists() ? homeSnap.data().categoryRules || {} : {};
      setLearned(rules);
      setPending(parsed.skippedPending);

      const next = markDuplicates(parsed.rows, items).map((row) => ({
        ...row,
        category: suggestCategory(row, rules),
        selected: !row.duplicate,
        changed: false,
      }));
      setRows(next);
      // Start with the latest month – "All months" is one click away
      const latest = next.reduce((max, row) => (row.date > max ? row.date : max), "").slice(0, 7);
      setMonth(latest || "all");
      if (next.every((row) => row.duplicate === "existing")) {
        setNotice({ kind: "info", text: t.importNothing });
      }
    } catch (err) {
      console.error("Could not read bank file:", err);
      setNotice({ kind: "error", text: t.importBadFile });
    } finally {
      setBusy(false);
    }
  };

  const update = (importId, patch) => {
    setRows((current) => current.map((row) => (row.importId === importId ? { ...row, ...patch } : row)));
  };

  // A category changed by hand also applies to other rows from the same shop
  // that you haven't changed yourself.
  const changeCategory = (target, category) => {
    setRows((current) =>
      current.map((row) => {
        if (row.importId === target.importId) return { ...row, category, changed: true };
        if (row.key === target.key && !row.changed) return { ...row, category };
        return row;
      })
    );
  };

  const selectVisible = (value) => {
    const ids = new Set(visible.filter((row) => row.duplicate !== "existing").map((row) => row.importId));
    setRows((current) => current.map((row) => (ids.has(row.importId) ? { ...row, selected: value } : row)));
  };

  const runImport = async () => {
    if (busy || selected.length === 0 || !auth.currentUser) return;
    setBusy(true);
    setNotice(null);
    try {
      for (let start = 0; start < selected.length; start += BATCH_SIZE) {
        const batch = writeBatch(db);
        selected.slice(start, start + BATCH_SIZE).forEach((row) => {
          batch.set(doc(collection(db, "homes", homeId, "expenses")), {
            description: row.description.slice(0, 200),
            amount: row.amount,
            category: row.category,
            type: row.type,
            date: row.date,
            createdAt: new Date(),
            createdBy: auth.currentUser.uid,
            importId: row.importId,
          });
        });
        await batch.commit();
      }

      // Remember categories you changed (shop -> category) for next time
      const changes = {};
      rows
        .filter((row) => row.changed && row.key && learned[row.key] !== row.category)
        .forEach((row) => {
          changes[row.key] = row.category;
        });
      if (Object.keys(changes).length > 0) {
        await setDoc(doc(db, "homes", homeId), { categoryRules: changes }, { merge: true });
        setLearned({ ...learned, ...changes });
      }

      const done = new Set(selected.map((row) => row.importId));
      setRows((current) =>
        current.map((row) => (done.has(row.importId) ? { ...row, duplicate: "existing", selected: false } : row))
      );
      setNotice({ kind: "ok", text: fill(t.importDone, selected.length) });
    } catch (err) {
      console.error("Import failed:", err);
      setNotice({ kind: "error", text: t.addError });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="import-open" onClick={() => setOpen(true)}>
        <span aria-hidden="true">⇪</span> {t.importOpen}
      </button>
    );
  }

  return (
    <section className="import">
      <div className="import-head">
        <div>
          <h2>{t.importTitle}</h2>
          <p>{t.importHint}</p>
        </div>
        <button
          type="button"
          className="quiet"
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          {t.close}
        </button>
      </div>

      <label className="import-file">
        <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" onChange={readFile} disabled={busy} />
        <span>{t.chooseFile}</span>
      </label>

      {notice ? (
        <p className={`import-notice ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>
          {notice.text}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <>
          {pending > 0 ? <p className="import-meta">{fill(t.importPending, pending)}</p> : null}
          <p className="import-meta">{t.importLearn}</p>

          <div className="import-toolbar">
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              <option value="all">
                {t.importAllMonths} ({rows.length})
              </option>
              {months.map((key) => (
                <option key={key} value={key}>
                  {monthLabel(key)} ({rows.filter((row) => row.date.startsWith(key)).length})
                </option>
              ))}
            </select>
            <button type="button" className="quiet" onClick={() => selectVisible(true)}>
              {t.selectAll}
            </button>
            <button type="button" className="quiet" onClick={() => selectVisible(false)}>
              {t.selectNone}
            </button>
          </div>

          <ul className="import-list">
            {visible.map((row) => (
              <li
                key={row.importId}
                className={`${row.selected ? "" : "off"} ${row.duplicate === "existing" ? "done" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={row.selected}
                  disabled={row.duplicate === "existing"}
                  aria-label={row.description}
                  onChange={(event) => update(row.importId, { selected: event.target.checked })}
                />
                <div className="import-main">
                  <strong>{row.description}</strong>
                  <span>
                    {row.date}
                    {row.duplicate ? (
                      <em className={`import-badge ${row.duplicate}`}>
                        {row.duplicate === "existing" ? t.dupExisting : t.dupPossible}
                      </em>
                    ) : null}
                  </span>
                </div>
                <span className={`import-amount ${row.type === "income" ? "money-in" : "money-out"}`}>
                  {row.type === "income" ? "+" : "−"}
                  {formatMoney(row.amount, lang, { currency: true })}
                </span>
                <select
                  className={row.category === "Other" ? "uncat" : ""}
                  value={row.category}
                  disabled={row.duplicate === "existing"}
                  aria-label={t.category}
                  onChange={(event) => changeCategory(row, event.target.value)}
                >
                  {CATEGORY_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {t.categories[key]}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>

          <div className="import-footer">
            <button type="button" className="primary" disabled={busy || selected.length === 0} onClick={runImport}>
              {fill(t.importSelected, selected.length)}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default BankImport;
