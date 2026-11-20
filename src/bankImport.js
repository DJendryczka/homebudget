// Import of account statements from a bank (CSV).
// Tested on an ICA Banken export: "Datum;Text;Typ;Belopp;Saldo", amounts like "-1 234,56 kr".
// Column names from other Swedish banks (Swedbank, Handelsbanken, SEB, Nordea) are recognised too.

const DATE_COLUMNS = ["datum", "bokföringsdag", "bokforingsdag", "transaktionsdatum", "bokföringsdatum", "date"];
const TEXT_COLUMNS = ["text", "beskrivning", "rubrik", "specifikation", "mottagare", "namn", "description", "referens"];
const AMOUNT_COLUMNS = ["belopp", "amount", "summa"];
const TYPE_COLUMNS = ["typ", "transaktionstyp", "type"];

// ---------- Reading the file ----------

// Bank files are UTF-8 or Windows-1252 (older exports) – try UTF-8 first.
export function decodeFile(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

function detectDelimiter(line) {
  const counts = [";", "\t", ","].map((d) => [d, line.split(d).length]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][0];
}

// Splits one CSV line, respecting "quoted; fields".
function splitLine(line, delimiter) {
  const out = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out.map((value) => value.trim());
}

// Column names are checked in priority order (e.g. "Beskrivning" before "Referens").
function findColumn(header, names) {
  const normalized = header.map((name) => name.toLowerCase().replace(/^\ufeff/, "").trim());
  for (const name of names) {
    const index = normalized.indexOf(name);
    if (index !== -1) return index;
  }
  return -1;
}

// "-1 234,56 kr" -> -1234.56 ; "1234.5" -> 1234.5 ; invalid -> null
export function parseBankAmount(text) {
  let clean = String(text).replace(/kr|sek/gi, "").replace(/\s/g, "");
  clean = clean.replace(/\u2212/g, "-");
  if (/,\d{1,2}$/.test(clean)) clean = clean.replace(/\./g, "").replace(",", ".");
  else clean = clean.replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
  return Number(clean);
}

// "2026-11-20", "20261120", "20.11.2026", "20/11/2026" -> "2026-11-20"
export function parseBankDate(text) {
  const value = String(text).trim();
  let match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  match = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  match = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return null;
}

// "Circle K Eslov         Eslov          Se " -> "Circle K Eslov Eslov Se"
export function cleanText(text) {
  return String(text).replace(/\s+/g, " ").trim();
}

// Key for learned categories: lowercase, no digits or punctuation.
// "Lidl369eslov" -> "lidl eslov", "Swish Anna Svensson" -> "swish anna svensson"
export function merchantKey(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[0-9]+/g, " ")
    .replace(/[^\p{L}\s&]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses a CSV file. Returns { rows, skippedPending, error }.
 * Each row: { date, description, amount (always > 0), type, bankType, key, importId }
 */
export function parseBankCsv(text) {
  const lines = text.replace(/^\ufeff/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return { rows: [], skippedPending: 0, error: "empty" };

  // The header is the first line that has a date column and an amount column
  let headerIndex = -1;
  let delimiter = ";";
  let columns = null;
  for (let i = 0; i < Math.min(lines.length, 15); i += 1) {
    delimiter = detectDelimiter(lines[i]);
    const header = splitLine(lines[i], delimiter);
    const date = findColumn(header, DATE_COLUMNS);
    const amount = findColumn(header, AMOUNT_COLUMNS);
    if (date !== -1 && amount !== -1) {
      columns = {
        date,
        amount,
        text: findColumn(header, TEXT_COLUMNS),
        type: findColumn(header, TYPE_COLUMNS),
      };
      headerIndex = i;
      break;
    }
  }
  if (!columns) return { rows: [], skippedPending: 0, error: "columns" };

  const rows = [];
  const seen = {};
  let skippedPending = 0;

  for (const line of lines.slice(headerIndex + 1)) {
    const cells = splitLine(line, delimiter);
    const bankType = columns.type !== -1 ? cells[columns.type] || "" : "";

    // Pending card payments come back later as an ordinary row – skip them
    if (/reserverat|preliminär|pending/i.test(bankType)) {
      skippedPending += 1;
      continue;
    }

    const date = parseBankDate(cells[columns.date]);
    const signed = parseBankAmount(cells[columns.amount]);
    if (!date || signed === null || signed === 0) continue;

    const description = cleanText(columns.text !== -1 ? cells[columns.text] : bankType) || "–";
    const amount = Math.abs(signed);

    // The same purchase can occur twice on the same day (e.g. two identical subscriptions),
    // so the n-th occurrence gets its own number. This lets a second import of an
    // overlapping file recognise exactly the rows that are already in.
    const base = `${date}|${signed.toFixed(2)}|${description.toLowerCase()}`;
    seen[base] = (seen[base] || 0) + 1;

    rows.push({
      date,
      description,
      amount,
      type: signed < 0 ? "expense" : "income",
      bankType,
      key: merchantKey(description),
      importId: `${base}|${seen[base]}`,
    });
  }

  return { rows, skippedPending, error: rows.length === 0 ? "rows" : null };
}

// ---------- Categories ----------

// Built-in rules for Swedish shops and companies. The first match wins,
// so the more specific ones (e.g. "ica försäkring") come before the general ones ("ica").
const RULES = [
  // Transfers between your own accounts and cash – not shopping
  [/^överföring|^overforing|^revolut|^bankomat|^uttag|kontantuttag/, "Other"],

  // Income
  [/^lön\b|\blön$|\bloneutbetalning|\blön från/, "Salary", "income"],

  // Savings and investments
  [/månadssparande|mikrospar|\bisk\b|avanza|nordnet|sparkonto/, "Savings"],
  [/pension|\bppm\b|\bamf\b|\bspp\b/, "Pension"],

  // Insurance (before ICA, Klarna and the banks)
  [/försäkr|forsakr|länsförsäkringar|lansforsakringar|\bif skade|folksam|trygg hansa|trygg-hansa|hedvig|mysafety|trafikförsäkringsföreningen|vikingvagassistans|viking/, "Insurance"],

  // Loans, credit, mortgages
  [/bolån|bolan|\blån\b|\blan \d|santander|collector|bluestep|resurs bank|entercard|seb kort|ica banken|prioritet finans|svea bank|walley|medmera bank|nordax|avida|klarna bank|swish klarna|^k klarna$|lendo|qliro/, "Credit"],

  // Electricity and energy
  [/kraftringen|ellevio|vattenfall|\be ?on\b|tibber|fortum|göteborg energi|svea solar|solar as a service|greenely|skellefteå kraft|jämtkraft|öresundskraft|oresundskraft/, "Electricity"],

  // Phone
  [/telia|tele2|telenor|hi3g|\btre\b|comviq|halebop|hallon|vimla|fello|chilimobil/, "Phone"],

  // Internet
  [/bahnhof|bredband|ownit|com hem|comhem|stofa|tele ?2 bredband|ip only/, "Internet"],

  // Housing, home, waste, hardware stores
  [/hyra|\bbrf\b|riksbyggen|\bhsb\b|renhållning|renhallning|va-avgift|vatten och avlopp|jula|jem & fix|jem fix|bauhaus|byggmax|\bjysk\b|ikea|clas ohlson|biltema|bygglan|beijer|hornbach|k rauta|\bmio\b|rusta/, "Housing"],

  // Health
  [/apotek|apotea|kronans|lloyds|dozapotek|apteka|rossmann|synsam|specsavers|ogonlakar|ögonläkar|tandläkar|tandlakar|vårdcentral|vardcentral|gonlkarna|pharma|1177|praktikertjänst/, "Health"],

  // Transport, fuel, parking, tolls, car
  [/circle k|preem|okq8|\bst ?1\b|\bingo\b|shell|q ?star|tanka|\bmol\b|orlen|parkster|aimo|easypark|apcoa|parkering|trängselskatt|trangselskatt|fordonsskatt|transportstyrelsen|carspect|bilprovning|besikt|minbilkoll|skånetrafiken|skanetrafiken|\bsj\b|västtrafik|\bsl\b|uber|bolt|taxi|däck|dack|\bprom\b|stena line|polferries|tt line|unity line|öresundsbron|oresundsbron/, "Transport"],

  // Restaurants and takeaway
  [/pizz|restaurang|restaurant|restauracja|ristorante|grill|burger|mcdonald|max hamburg|sushi|pastamannen|café|cafe|kafé|espresso house|foodora|wolt|uber eats|kebab|thai|bistro|krog/, "Restaurant"],

  // Sweets and snacks
  [/godis|pressbyrån|pressbyran|7 eleven|7-eleven|karamell/, "Sweets"],

  // Gifts and donations
  [/förbund|foerbund|insamling|cancerfond|röda korset|roda korset|unicef|läkare utan gränser|blomsterlandet|interflora|presentkort/, "Gifts"],

  // Groceries (after "ica försäkring", "ica banken", "apotek hjärtat ica")
  [/\bica\b|coop|willys|lidl|hemköp|hemkop|city gross|citygross|netto|mathem|matsmart|\bzabka\b|\bżabka\b|biedronka|tempo|handlar'n|handlarn|axfood|polsca/, "Food"],

  // Subscriptions and digital services
  [/netflix|disney|spotify|\bhbo\b|\bmax\b|viaplay|youtube|google one|google|apple com|apple\.com|icloud|\btvn\b|grok|openai|chatgpt|anthropic|claude|microsoft|adobe|storytel|bookbeat|klarna mem|everai|simply com|aspiegel|patreon|amazon prime|cmore|tv4/, "Subscriptions"],

  // Clothes
  [/h&m|\bhm\b|kappahl|lindex|zalando|dressmann|stadium|intersport|jack & jones|vero moda|boozt/, "Clothes"],

  // Pets
  [/zoo|djurmagazinet|musti|veterinär|veterinar|djursjukhus|bozita/, "Pets"],

  // Kids
  [/lekia|br leksaker|babyland|jollyroom|polarn o pyret/, "Kids"],

  // Entertainment
  [/systembolaget|\bbio\b|filmstaden|steam|playstation|xbox|nintendo|ticketmaster|liseberg/, "Entertainment"],
];

/** Suggested category for a row: first a learned rule, then the built-in ones. */
export function suggestCategory(row, learned = {}) {
  if (learned[row.key]) return learned[row.key];
  // Check both the key (without digits/punctuation) and the original text in lowercase,
  // so that "Okq8", "St1" or "Hi3g" are matched too.
  const texts = [row.key, cleanText(row.description).toLowerCase()];
  for (const [pattern, category, onlyType] of RULES) {
    if (onlyType && onlyType !== row.type) continue;
    if (texts.some((text) => pattern.test(text))) return category;
  }
  return "Other";
}

// ---------- Duplicates ----------

const DAY = 24 * 60 * 60 * 1000;
const POSSIBLE_WINDOW_DAYS = 4;

function dayNumber(iso) {
  return Math.round(Date.UTC(...iso.split("-").map((v, i) => (i === 1 ? Number(v) - 1 : Number(v)))) / DAY);
}

/**
 * Marks rows that are already in the app:
 *  - "existing": imported before (same importId)
 *  - "possible": a transaction you added by hand (or from the recurring list) with the same
 *    amount and type, at most 4 days away – the bank often books a day or a few later.
 *    Each such transaction can only "use up" one row.
 */
export function markDuplicates(rows, items) {
  const imported = new Set(items.filter((item) => item.importId).map((item) => item.importId));
  const manual = items
    .filter((item) => !item.importId)
    .map((item) => ({ key: `${item.amount.toFixed(2)}|${item.type}`, day: dayNumber(item.date), used: false }));

  return rows.map((row) => {
    if (imported.has(row.importId)) return { ...row, duplicate: "existing" };
    const key = `${row.amount.toFixed(2)}|${row.type}`;
    const day = dayNumber(row.date);
    const match = manual
      .filter((item) => !item.used && item.key === key && Math.abs(item.day - day) <= POSSIBLE_WINDOW_DAYS)
      .sort((a, b) => Math.abs(a.day - day) - Math.abs(b.day - day))[0];
    if (match) {
      match.used = true;
      return { ...row, duplicate: "possible" };
    }
    return { ...row, duplicate: null };
  });
}
