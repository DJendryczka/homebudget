      <div className="dash-top">
        <div className="dash-card">
          <div className="totals">
            <div className="total total-in">
              <span>{t.income}</span>
              <strong>{income.toFixed(0)}</strong>
            </div>
            <div className="total total-out">
              <span>{t.expenses}</span>
              <strong>{expenses.toFixed(0)}</strong>
            </div>
            <div className={`total ${balance >= 0 ? "total-ok" : "total-bad"}`}>
              <span>{t.balance}</span>
              <strong>{balance.toFixed(0)}</strong>
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
