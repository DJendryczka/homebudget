import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { SUPER_ADMIN_EMAIL } from "../admin";
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
  const [users, setUsers] = useState([]);

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

  useEffect(() => {
    return onSnapshot(collection(db, "users"), (snapshot) => {
      const next = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (a.email || "").localeCompare(b.email || ""));
      setUsers(next);
    });
  }, []);

  const setStatus = async (id, status) => {
    await setDoc(
      doc(db, "accessRequests", id),
      { status, decidedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const revoke = async (user) => {
    if ((user.email || "").toLowerCase() === SUPER_ADMIN_EMAIL) return;
    await setStatus(user.id, "denied");
  };

  return (
    <section className="panel">
      <h2>{t.currentUsers}</h2>
      <p className="home-label">{t.currentUsersHint}</p>
      {users.length === 0 ? (
        <p className="empty">{t.noUsers}</p>
      ) : (
        <ul className="admin-list">
          {users.map((user) => {
            const isAdmin = (user.email || "").toLowerCase() === SUPER_ADMIN_EMAIL;
            return (
              <li key={user.id} className="admin-row">
                <div>
                  <strong>{user.name || user.email}</strong>
                  <span>{user.email}</span>
                  <small>{isAdmin ? t.youAdmin : t.hasHome}</small>
                </div>
                <div className="row-actions">
                  {isAdmin ? (
                    <span className="admin-status approved">{t.youAdmin}</span>
                  ) : (
                    <button type="button" className="danger" onClick={() => revoke(user)}>
                      {t.revoke}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="admin-next">{t.adminTitle}</h2>
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
