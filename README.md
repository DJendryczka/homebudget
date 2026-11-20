# HomeBudget

A household budget app for tracking income and expenses together with the people you live with.
Installable on your phone as a PWA. UI in Swedish, Polish and English.

## Features

- **Google sign-in** with manual approval: new users wait until the admin approves them
- **Shared home**: transactions and budgets belong to a home, not to a single person
- **Transactions**: income and expenses with category and date, editing and deletion
- **Monthly budgets** per category with progress bars
- **Overview**: yearly totals, savings pots (Sparande, Pension, Buffertkonto), monthly chart,
  where the money goes, and a side-by-side comparison of two months
- **PWA**: add to the home screen on iPhone/Android

## Stack

React 19 · Vite · Firebase Authentication · Cloud Firestore

## Deploy

Nothing deploys automatically on push – publish from your own computer:

```bash
npm run build
firebase deploy --only hosting           # the app
firebase deploy --only firestore:rules   # security rules from firestore.rules
```

`firebase.json` sets `Cache-Control: no-cache`, so the home-screen app picks up a new
version right after a deploy.

## Getting started

```bash
npm install
npm run dev      # dev server
npm run build    # production build to dist/
npm run lint
```

The Firebase config is in `src/firebase.jsx`. The Firebase web API key is public by design –
access to data is controlled by the security rules.

## Firestore

Security rules are in [`firestore.rules`](firestore.rules).

| Collection | Contents |
|---|---|
| `accessRequests/{uid}` | Access request, `status`: `pending` / `approved` / `denied` |
| `users/{uid}` | Profile and `homeId` |
| `homes/{homeId}` | Home name, owner, `budgets` per category |
| `homes/{homeId}/members/{uid}` | Members of the home |
| `homes/{homeId}/expenses/{id}` | Transactions |

## Structure

```
src/
  App.jsx              login → approval → home → tabs
  categories.js        list of categories (the single source)
  totals.js            sums per type / category
  useExpenses.js       live list of transactions for a home
  ensureHome.js        creates a home on first login (+ migration of old data)
  i18n.jsx             translations sv / pl / en
  admin.js             admin e-mail
  base.css             base styles
  Components/
    Overview.jsx       Overview tab
    AddExpense.jsx     add form
    ExpenseList.jsx    Month tab: totals, budgets, transaction list
    BudgetBars.jsx     budget bars (shared)
    Settings.jsx       language, home name, budgets
    AdminPanel.jsx     approving users
```

### Adding a category

1. Add the key in `src/categories.js`
2. Add a translation under `categories` in `src/i18n.jsx` (sv, pl, en)

## Installing on iPhone

Open the app in Safari → **Share** → **Add to Home Screen**.
