import { createContext, useContext, useMemo, useState } from "react";

export const translations = {
  sv: {
    headline: "Håll koll på pengarna.",
    headline2: "Utan krångel.",
    sub: "Fyra pelare som gör budgeten enkel att leva med varje dag.",
    login: "Logga in med Google",
    trust: "Säker inloggning via Google · inget lösenord",
    cards: [
      { id: "tx", kicker: "01", title: "Transaktioner", text: "Lägg till inkomst eller utgift på några sekunder." },
      { id: "bal", kicker: "02", title: "Saldo", text: "Se månadens plus, minus och balans direkt." },
      { id: "bud", kicker: "03", title: "Budgetar", text: "Sätt gränser per kategori och håll dig till dem." },
      { id: "rep", kicker: "04", title: "Rapporter", text: "Förstå vart pengarna tar vägen, månad efter månad." },
    ],
    opening: "Öppnar ditt hem…",
    homeError: "Kunde inte öppna ditt hem. Kontrollera Firestore-reglerna.",
    addTitle: "Lägg till transaktion",
    addHint: "Inkomster och utgifter för det här hemmet.",
    description: "Beskrivning",
    amount: "Belopp",
    expense: "Utgift",
    income: "Inkomst",
    add: "Lägg till",
    transactions: "Transaktioner",
    home: "Hem",
    logout: "Logga ut",
    expenses: "Utgifter",
    balance: "Balans",
    month: "Månad",
    date: "Datum",
    category: "Kategori",
    type: "Typ",
    delete: "Ta bort",
    deleteConfirm: "Ta bort den här transaktionen?",
    empty: "Inga transaktioner för",
    navOverview: "Översikt",
    navMonth: "Månad",
    navSettings: "Inställningar",
    year: "År",
    where: "Vart pengarna går",
    noYear: "Inga transaktioner för det här året.",
    language: "Språk",
    homeName: "Hemmets namn",
    save: "Spara",
    saving: "Sparar…",
    saved: "Namnet sparades.",
    saveError: "Kunde inte spara namnet.",
    overviewOf: "Översikt av",
    categories: {
      Food: "Mat",
      Transport: "Transport",
      Housing: "Boende",
      Entertainment: "Nöje",
      Health: "Hälsa",
      Salary: "Lön",
      Other: "Övrigt",
    },
  },
  pl: {
    headline: "Trzymaj pieniądze",
    headline2: "pod kontrolą.",
    sub: "Cztery filary, które sprawiają, że budżet jest prosty na co dzień.",
    login: "Zaloguj się przez Google",
    trust: "Bezpieczne logowanie przez Google · bez hasła",
    cards: [
      { id: "tx", kicker: "01", title: "Transakcje", text: "Dodaj przychód albo wydatek w kilka sekund." },
      { id: "bal", kicker: "02", title: "Saldo", text: "Zobacz plus, minus i bilans miesiąca od razu." },
      { id: "bud", kicker: "03", title: "Budżety", text: "Ustal limity na kategorie i trzymaj się ich." },
      { id: "rep", kicker: "04", title: "Raporty", text: "Zrozum, dokąd idą pieniądze, miesiąc po miesiącu." },
    ],
    opening: "Otwieram twój dom…",
    homeError: "Nie udało się otworzyć domu. Sprawdź reguły Firestore.",
    addTitle: "Dodaj transakcję",
    addHint: "Przychody i wydatki tego domu.",
    description: "Opis",
    amount: "Kwota",
    expense: "Wydatek",
    income: "Przychód",
    add: "Dodaj",
    transactions: "Transakcje",
    home: "Dom",
    logout: "Wyloguj",
    expenses: "Wydatki",
    balance: "Saldo",
    month: "Miesiąc",
    date: "Data",
    category: "Kategoria",
    type: "Typ",
    delete: "Usuń",
    deleteConfirm: "Usunąć tę transakcję?",
    empty: "Brak transakcji dla",
    navOverview: "Przegląd",
    navMonth: "Miesiąc",
    navSettings: "Ustawienia",
    year: "Rok",
    where: "Gdzie schodzą pieniądze",
    noYear: "Brak transakcji w tym roku.",
    language: "Język",
    homeName: "Nazwa domu",
    save: "Zapisz",
    saving: "Zapisuję…",
    saved: "Nazwa domu została zapisana.",
    saveError: "Nie udało się zapisać nazwy.",
    overviewOf: "Przegląd domu",
    categories: {
      Food: "Jedzenie",
      Transport: "Transport",
      Housing: "Mieszkanie",
      Entertainment: "Rozrywka",
      Health: "Zdrowie",
      Salary: "Wynagrodzenie",
      Other: "Inne",
    },
  },
  en: {
    headline: "Keep your money",
    headline2: "in clear view.",
    sub: "Four pillars that make a home budget easy to live with.",
    login: "Sign in with Google",
    trust: "Secure Google sign-in · no password",
    cards: [
      { id: "tx", kicker: "01", title: "Transactions", text: "Add income or an expense in a few seconds." },
      { id: "bal", kicker: "02", title: "Balance", text: "See the month’s in, out and balance at a glance." },
      { id: "bud", kicker: "03", title: "Budgets", text: "Set a limit per category and stay inside it." },
      { id: "rep", kicker: "04", title: "Reports", text: "Understand where the money goes, month after month." },
    ],
    opening: "Opening your home…",
    homeError: "Could not open your home. Check Firestore rules.",
    addTitle: "Add transaction",
    addHint: "Income and expenses for this home.",
    description: "Description",
    amount: "Amount",
    expense: "Expense",
    income: "Income",
    add: "Add",
    transactions: "Transakcje",
    home: "Home",
    logout: "Log out",
    expenses: "Expenses",
    balance: "Balance",
    month: "Month",
    date: "Date",
    category: "Category",
    type: "Type",
    delete: "Delete",
    deleteConfirm: "Delete this transaction?",
    empty: "No transactions for",
    navOverview: "Overview",
    navMonth: "Month",
    navSettings: "Settings",
    year: "Year",
    where: "Where the money goes",
    noYear: "No transactions for this year.",
    language: "Language",
    homeName: "Home name",
    save: "Save",
    saving: "Saving…",
    saved: "The name was saved.",
    saveError: "Could not save the name.",
    overviewOf: "Overview of",
    categories: {
      Food: "Food",
      Transport: "Transport",
      Housing: "Housing",
      Entertainment: "Entertainment",
      Health: "Health",
      Salary: "Salary",
      Other: "Other",
    },
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("hb-lang") || "sv");

  const setLang = (next) => {
    localStorage.setItem("hb-lang", next);
    setLangState(next);
  };

  const value = useMemo(() => ({ lang, setLang, t: translations[lang] }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}

export function LangSwitch({ variant = "hero" }) {
  const { lang, setLang } = useI18n();

  return (
    <div className={variant === "hero" ? "lang-switcher" : "lang-inline"}>
      {["sv", "pl", "en"].map((code) => (
        <button
          key={code}
          type="button"
          className={lang === code ? "active" : ""}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
