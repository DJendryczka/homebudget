// The one place where categories live. Order = order in the dropdown lists.
// Translations are in i18n.jsx under t.categories[key].
export const CATEGORY_KEYS = [
  "Food",
  "Sweets",
  "Phone",
  "Restaurant",
  "Transport",
  "Housing",
  "Credit",
  "Electricity",
  "Internet",
  "Subscriptions",
  "Clothes",
  "Health",
  "Kids",
  "Insurance",
  "Entertainment",
  "Gifts",
  "Pets",
  "Savings",
  "Pension",
  "Buffertkonto",
  "Salary",
  "Other",
];

// Categories you can set a monthly budget for (income is left out).
export const BUDGET_KEYS = CATEGORY_KEYS.filter((key) => key !== "Salary");
