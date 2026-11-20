export const LOCALES = { sv: "sv-SE", pl: "pl-PL", en: "en-GB" };

// Amount formatted for the UI language: sv "1 234,50", en "1,234.50".
// With currency: true, " kr" / "SEK" is appended according to the language.
export function formatMoney(value, lang, { decimals = 2, currency = false } = {}) {
  return new Intl.NumberFormat(LOCALES[lang] || "sv-SE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...(currency ? { style: "currency", currency: "SEK" } : {}),
  }).format(value);
}

// Reads an amount typed by the user: accepts "1 234,50", "1234.5", "99".
// Returns a number > 0 or null if the value is invalid.
export function parseAmount(text) {
  const clean = String(text).replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const value = Number(clean);
  return value > 0 ? value : null;
}

// Amount for the input field when editing (comma in sv/pl).
export function amountForInput(value, lang) {
  const text = Number.isInteger(value) ? String(value) : Number(value).toFixed(2);
  return lang === "en" ? text : text.replace(".", ",");
}
