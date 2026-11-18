import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useI18n } from "../i18n";

function formatWhen(value, lang) {
  if (!value) return "";
  const date = value.toDate ? value.toDate() : new Date(value);
  const locales = { sv: "sv-SE", pl: "pl-PL", en: "en-GB" };
  return date.toLocaleString(locales[lang] || "sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function AdminPanel() {
  const { lang, t } = useI18n();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    return onSnapshot(collection(db, "accessRequests"), (snapshot) => {
      const next = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => {
          const aTime = a.requestedAt?.toMillis?.() || 0;
          const bTime = b.requestedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
      setRequests(next);
    });
  }, []);

  const setStatus = async (id, status) => {
    await updateDoc(doc(db, "accessRequests", id), {
      status,
      decidedAt: serverTimestamp(),
    });
  };

  return (
    <section className="panel">
      <h2>{t.adminTitle}</h2>
      <p className="home-label">{t.adminHint}</p>

      {requests.length === 0 ? (
        <p className="empty">{t.adminEmpty}</p>
      ) : (
        <ul className="admin-list">
          {requests.map((request) => (
            <li key={request.id} className={`admin-row status-${request.status || "pending"}`}>
              <div>
                <strong>{request.name || request.email}</strong>
                <span>{request.email}</span>
                <small>{formatWhen(request.requestedAt, lang)}</small>
              </div>
              <div className="row-actions">
                <span className={`admin-status ${request.status || "pending"}`}>
                  {request.status === "approved"
                    ? t.approved
                    : request.status === "denied"
                      ? t.denied
                      : t.pending}
                </span>
                {request.status !== "approved" ? (
                  <button type="button" className="quiet" onClick={() => setStatus(request.id, "approved")}>
                    {t.approve}
                  </button>
                ) : null}
                {request.status !== "denied" ? (
                  <button type="button" className="danger" onClick={() => setStatus(request.id, "denied")}>
                    {t.deny}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default AdminPanel;
