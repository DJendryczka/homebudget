          <div className="pair">
            <div className="total total-in">
              <span>{t.income}</span>
              <strong>{income.toFixed(0)}</strong>
            </div>
            <div className="pot pot-savings">
              <span>{t.categories.Savings}</span>
              <strong>
                {yearItems.filter((item) => item.category === "Savings").reduce((total, item) => total + item.amount, 0).toFixed(0)}
              </strong>
            </div>
            <div className="total total-out">
              <span>{t.expenses}</span>
              <strong>{expenses.toFixed(0)}</strong>
            </div>
            <div className="pot pot-pension">
              <span>{t.categories.Pension}</span>
              <strong>
                {yearItems.filter((item) => item.category === "Pension").reduce((total, item) => total + item.amount, 0).toFixed(0)}
              </strong>
            </div>
            <div className={`total ${balance >= 0 ? "total-ok" : "total-bad"}`}>
              <span>{t.balance}</span>
              <strong>{balance.toFixed(0)}</strong>
            </div>
            <div className="pot pot-buffer">
              <span>{t.categories.Buffertkonto}</span>
              <strong>
                {yearItems.filter((item) => item.category === "Buffertkonto").reduce((total, item) => total + item.amount, 0).toFixed(0)}
              </strong>
            </div>
          </div>
