import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useI18n } from "../i18n";

function Waiting({ status }) {
  const { t } = useI18n();
  const denied = status === "denied";

  return (
    <div className="app-shell">
      <section className="panel wait-card">
        <h2>{denied ? t.accessDeniedTitle : t.accessWaitTitle}</h2>
        <p>{denied ? t.accessDeniedText : t.accessWaitText}</p>
        <button
          className="logout"
          type="button"
          onClick={() => {
            signOut(auth).catch((error) => console.error("Logout failed:", error));
          }}
        >
          {t.logout}
        </button>
      </section>
    </div>
  );
}

export default Waiting;
