import { useI18n } from "../i18n";

// Budget bars: how much was spent per category compared with the limit.
// budgets = { category: limit }, spent = { category: sum } (see spentByCategory).
function BudgetBars({ budgets = {}, spent = {} }) {
  const { t } = useI18n();

  const rows = Object.entries(budgets)
    .filter(([, limit]) => Number(limit) > 0)
    .map(([key, limit]) => ({ key, limit: Number(limit), spent: spent[key] || 0 }))
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit);

  if (rows.length === 0) return null;

  return (
    <ul className="budget-bars">
      {rows.map((row) => {
        const share = Math.round((row.spent / row.limit) * 100);
        const over = row.spent > row.limit;
        const left = row.limit - row.spent;
        return (
          <li key={row.key}>
            <div className="cat-row">
              <span>{t.categories[row.key] || row.key}</span>
              <strong className={over ? "money-out" : "budget-meta"}>
                {row.spent.toFixed(0)} / {row.limit.toFixed(0)} · {over ? t.over : `${left.toFixed(0)} ${t.remaining}`}
              </strong>
            </div>
            <div className={`cat-track ${over ? "over" : "ok"}`}>
              <span style={{ width: `${Math.min(share, 100)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default BudgetBars;
