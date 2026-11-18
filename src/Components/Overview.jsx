import { useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { useExpenses } from "../useExpenses";

const LOCALES = { sv: "sv-SE", pl: "pl-PL", en: "en-GB" };

function sum(list, type) {
  return list.filter((item) => item.type === type).reduce((total, item) => total + item.amount, 0);
}

function Overview({ homeId, homeName }) {
  const { lang, t } = useI18n();
  const { items } = useExpenses(homeId);
  const currentYear = String(new Date().getFullYear());
  const [year, setYear] = useState(currentYear);
  const shownName = !homeName || homeName === "Home" ? t.home : homeName;

  const years = useMemo(() => {
    const found = items.map((item) => item.year);
    return [...new Set([currentYear, ...found])].sort((a, b) => b.localeCompare(a));
  }, [items, currentYear]);

  const yearItems = items.filter((item) => item.year === year);
  const income = sum(yearItems, "income");
  const expenses = sum(yearItems, "expense");
  const balance = income - expenses;

  const months = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    const monthItems = yearItems.filter((item) => item.monthKey === key);
    return {
      key,
      label: new Date(Number(year), index, 1).toLocaleString(LOCALES[lang], { month: "short" }),
      income: sum(monthItems, "income"),
      expense: sum(monthItems, "expense"),
    };
  });
  const max = Math.max(1, ...months.flatMap((month) => [month.income, month.expense]));

  const categories = Object.values(
    yearItems
      .filter((item) => item.type === "expense")
      .reduce((groups, item) => {
        const current = groups[item.category] || { key: item.category, amount: 0 };
        current.amount += item.amount;
        groups[item.category] = current;
        return groups;
      }, {})
  ).sort((a, b) => b.amount - a.amount);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>
            {t.overviewOf} {shownName}
          </h2>
          <p className="home-label">{t.year}</p>
        </div>
        <select className="year-select" value={year} onChange={(event) => setYear(event.target.value)}>
          {years.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="totals">
        <div className="total total-in">
          <span>{t.income}</span>
          <strong>{income.toFixed(2)}</strong>
        </div>
        <div className="total total-out">
          <span>{t.expenses}</span>
          <strong>{expenses.toFixed(2)}</strong>
        </div>
        <div className={`total ${balance >= 0 ? "total-ok" : "total-bad"}`}>
          <span>{t.balance}</span>
          <strong>{balance.toFixed(2)}</strong>
        </div>
      </div>

      <div className="year-chart" aria-hidden="true">
        {months.map((month) => (
          <div className="year-col" key={month.key}>
            <div className="year-bars">
              <span className="bar-in" style={{ height: `${(month.income / max) * 100}%` }} />
              <span className="bar-out" style={{ height: `${(month.expense / max) * 100}%` }} />
            </div>
            <small>{month.label}</small>
          </div>
        ))}
      </div>
      <p className="legend">
        <i className="swatch-in" /> {t.income}
        <i className="swatch-out" /> {t.expenses}
      </p>

      <h3>{t.where}</h3>
      {categories.length === 0 ? (
        <p className="empty">{t.noYear}</p>
      ) : (
        <ul className="cats">
          {categories.map((category) => {
            const share = expenses > 0 ? Math.round((category.amount / expenses) * 100) : 0;
            return (
              <li key={category.key}>
                <div className="cat-row">
                  <span>{t.categories[category.key] || category.key}</span>
                  <strong>
                    {category.amount.toFixed(2)} · {share}%
                  </strong>
                </div>
                <div className="cat-track">
                  <span style={{ width: `${share}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default Overview;
