import { useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { useExpenses } from "../useExpenses";
import { spentByCategory, sumByCategory, sumByType } from "../totals";
import BudgetBars from "./BudgetBars";
import "../budget-ui.css";
import "../compare.css";
import "../dashboard.css";

const LOCALES = { sv: "sv-SE", pl: "pl-PL", en: "en-GB" };

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonthKey(year) {
  const now = new Date();
  const month = year === String(now.getFullYear()) ? now.getMonth() + 1 : 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function previousMonthKey(key) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return monthKey(date);
}

function monthLabel(key, lang) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString(LOCALES[lang], { month: "short", year: "numeric" });
}

function Overview({ homeId, homeName, budgets = {} }) {
  const { lang, t } = useI18n();
  const { items } = useExpenses(homeId);
  const currentYear = String(new Date().getFullYear());
  const nowKey = monthKey(new Date());
  const [year, setYear] = useState(currentYear);
  const [budgetMonth, setBudgetMonth] = useState(() => currentMonthKey(currentYear));
  const [compareA, setCompareA] = useState(nowKey);
  const [compareB, setCompareB] = useState(previousMonthKey(nowKey));
  const shownName = !homeName || homeName === "Home" ? t.home : homeName;

  const years = useMemo(() => {
    const found = items.map((item) => item.year);
    return [...new Set([currentYear, ...found])].sort((a, b) => b.localeCompare(a));
  }, [items, currentYear]);

  const yearItems = items.filter((item) => item.year === year);
  const income = sumByType(yearItems, "income");
  const expenses = sumByType(yearItems, "expense");
  const balance = income - expenses;

  const months = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    const monthItems = yearItems.filter((item) => item.monthKey === key);
    return {
      key,
      label: new Date(Number(year), index, 1).toLocaleString(LOCALES[lang], { month: "short" }),
      income: sumByType(monthItems, "income"),
      expense: sumByType(monthItems, "expense"),
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

  const budgetSpent = spentByCategory(items.filter((item) => item.monthKey === budgetMonth));

  const compareOptions = useMemo(() => {
    const found = items.map((item) => item.monthKey);
    return [...new Set([nowKey, previousMonthKey(nowKey), ...found])].sort((a, b) => b.localeCompare(a));
  }, [items, nowKey]);

  const sideA = items.filter((item) => item.monthKey === compareA);
  const sideB = items.filter((item) => item.monthKey === compareB);
  const catsA = spentByCategory(sideA);
  const catsB = spentByCategory(sideB);
  const compareRows = [...new Set([...Object.keys(catsA), ...Object.keys(catsB)])]
    .map((key) => {
      const a = catsA[key] || 0;
      const b = catsB[key] || 0;
      return { key, a, b, diff: a - b };
    })
    .sort((left, right) => Math.abs(right.diff) - Math.abs(left.diff));
  const incomeA = sumByType(sideA, "income");
  const incomeB = sumByType(sideB, "income");
  const expenseA = sumByType(sideA, "expense");
  const expenseB = sumByType(sideB, "expense");

  return (
    <section className="panel dash">
      <div className="panel-head">
        <div>
          <h2>
            {t.overviewOf} {shownName}
          </h2>
          <p className="home-label">{t.year}</p>
        </div>
        <select
          className="year-select"
          value={year}
          onChange={(event) => {
            const nextYear = event.target.value;
            setYear(nextYear);
            setBudgetMonth(currentMonthKey(nextYear));
          }}
        >
          {years.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="dash-top">
        <div className="dash-card">
          <div className="pair">
            <div className="total total-in">
              <span>{t.income}</span>
              <strong>{income.toFixed(0)}</strong>
            </div>
            <div className="pot pot-savings">
              <span>{t.categories.Savings}</span>
              <strong>{sumByCategory(yearItems, "Savings").toFixed(0)}</strong>
            </div>
            <div className="total total-out">
              <span>{t.expenses}</span>
              <strong>{expenses.toFixed(0)}</strong>
            </div>
            <div className="pot pot-pension">
              <span>{t.categories.Pension}</span>
              <strong>{sumByCategory(yearItems, "Pension").toFixed(0)}</strong>
            </div>
            <div className={`total ${balance >= 0 ? "total-ok" : "total-bad"}`}>
              <span>{t.balance}</span>
              <strong>{balance.toFixed(0)}</strong>
            </div>
            <div className="pot pot-buffer">
              <span>{t.categories.Buffertkonto}</span>
              <strong>{sumByCategory(yearItems, "Buffertkonto").toFixed(0)}</strong>
            </div>
          </div>
        </div>

        <div className="dash-card">
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
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card dash-fill">
          <div className="month-row">
            <h3>{t.compare}</h3>
            <div className="compare-picks">
              <select className="year-select" value={compareA} onChange={(event) => setCompareA(event.target.value)}>
                {compareOptions.map((key) => (
                  <option key={key} value={key}>
                    {monthLabel(key, lang)}
                  </option>
                ))}
              </select>
              <span>{t.vs}</span>
              <select className="year-select" value={compareB} onChange={(event) => setCompareB(event.target.value)}>
                {compareOptions.map((key) => (
                  <option key={key} value={key}>
                    {monthLabel(key, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="compare-totals">
            <div>
              <span>{t.income}</span>
              <strong>{incomeA.toFixed(0)}</strong>
              <small>{incomeB.toFixed(0)}</small>
            </div>
            <div>
              <span>{t.expenses}</span>
              <strong>{expenseA.toFixed(0)}</strong>
              <small>{expenseB.toFixed(0)}</small>
            </div>
            <div>
              <span>{t.difference}</span>
              <strong className={expenseA - expenseB > 0 ? "money-out" : "money-in"}>
                {expenseA - expenseB > 0 ? "+" : ""}
                {(expenseA - expenseB).toFixed(0)}
              </strong>
            </div>
          </div>
          {compareRows.length === 0 ? (
            <p className="empty">{t.noCompare}</p>
          ) : (
            <ul className="compare-list">
              {compareRows.map((row) => (
                <li key={row.key}>
                  <span>{t.categories[row.key] || row.key}</span>
                  <strong>{row.a.toFixed(0)}</strong>
                  <strong>{row.b.toFixed(0)}</strong>
                  <strong className={row.diff > 0 ? "money-out" : row.diff < 0 ? "money-in" : ""}>
                    {row.diff > 0 ? "+" : ""}
                    {row.diff.toFixed(0)}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dash-stack">
          <div className="dash-card">
            <div className="month-row">
              <h3>{t.budgets}</h3>
              <select className="year-select" value={budgetMonth} onChange={(event) => setBudgetMonth(event.target.value)}>
                {months.map((month) => (
                  <option key={month.key} value={month.key}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            {Object.values(budgets).some((limit) => Number(limit) > 0) ? (
              <BudgetBars budgets={budgets} spent={budgetSpent} />
            ) : (
              <p className="empty">{t.noBudget}</p>
            )}
          </div>

          <div className="dash-card dash-grow">
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
                          {category.amount.toFixed(0)} · {share}%
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
          </div>
        </div>
      </div>
    </section>
  );
}

export default Overview;
