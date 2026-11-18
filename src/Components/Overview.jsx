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
          <div className="pots">
            {["Savings", "Pension", "Buffer", "Account"].map((key) => {
              const amount = yearItems
                .filter((item) => item.category === key)
                .reduce((total, item) => total + item.amount, 0);
              return (
                <div className="pot" key={key}>
                  <span>{t.categories[key]}</span>
                  <strong>{amount.toFixed(0)}</strong>
                </div>
              );
            })}
          </div>
