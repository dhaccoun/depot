export type ParsedRow = {
  lineNo: number;
  postedOn: string;
  label: string;
  amount: number;
};

export type ParseResult = {
  rows: ParsedRow[];
  skipped: number;
};

const DATE_KEYS = [
  "date operation",
  "date de operation",
  "transaction date",
  "posted date",
  "booking date",
  "date valeur",
  "date",
];
const LABEL_KEYS = [
  "libelle",
  "description",
  "merchant",
  "details",
  "memo",
  "wording",
  "label",
  "name",
];
const AMOUNT_KEYS = ["montant", "amount", "valeur", "value"];
const DEBIT_KEYS = ["debit", "withdrawal", "sortie", "depense"];
const CREDIT_KEYS = ["credit", "deposit", "entree", "depot"];
const TYPE_KEYS = ["sens", "type mouvement", "dc"];

function norm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function detectDelimiter(headerLine: string): string {
  const semi = headerLine.split(";").length;
  const comma = headerLine.split(",").length;
  const tab = headerLine.split("\t").length;
  if (tab >= semi && tab >= comma && tab > 1) return "\t";
  if (semi > comma) return ";";
  return ",";
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function findCol(headers: string[], keys: string[]): number {
  const normalized = headers.map(norm);
  for (const key of keys) {
    const index = normalized.findIndex((header) => header === key);
    if (index >= 0) return index;
  }
  for (const key of keys) {
    const index = normalized.findIndex((header) => header.includes(key));
    if (index >= 0) return index;
  }
  return -1;
}

export function parseAmount(raw: string): number | null {
  let value = raw.trim().replace(/[\s\u00a0\u202f]/g, "");
  if (!value || value === "-" || value === "—") return null;
  let negative = false;
  if (value.startsWith("(") && value.endsWith(")")) {
    negative = true;
    value = value.slice(1, -1);
  }
  if (value.startsWith("+")) value = value.slice(1);
  if (value.startsWith("-")) {
    negative = true;
    value = value.slice(1);
  }
  if (value.includes(",") && value.includes(".")) {
    if (value.lastIndexOf(",") > value.lastIndexOf(".")) {
      value = value.replace(/\./g, "").replace(",", ".");
    } else {
      value = value.replace(/,/g, "");
    }
  } else if (value.includes(",")) {
    value = value.replace(",", ".");
  }
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return negative ? -Math.abs(amount) : amount;
}

export function parseDate(raw: string): string | null {
  const value = raw.trim();
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const local = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (!local) return null;
  let day = Number(local[1]);
  let month = Number(local[2]);
  const year = local[3];
  if (day <= 12 && month > 12) {
    const swap = day;
    day = month;
    month = swap;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function cell(cells: string[], index: number): string {
  if (index < 0 || index >= cells.length) return "";
  return cells[index] ?? "";
}

function isBalanceRow(label: string): boolean {
  const name = norm(label);
  return (
    name.startsWith("solde") ||
    name.startsWith("total") ||
    name.startsWith("report")
  );
}

function isDebitType(raw: string): boolean {
  const name = norm(raw);
  return (
    name === "d" ||
    name.startsWith("debit") ||
    name.startsWith("sortie") ||
    name.startsWith("depense") ||
    name.startsWith("withdrawal")
  );
}

export function parseStatementCsv(text: string): ParseResult {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter((line) => line.trim().length > 0);
  if (!lines.length) return { rows: [], skipped: 0 };

  const delimiter = detectDelimiter(lines[0] ?? "");
  const headers = splitCsvLine(lines[0] ?? "", delimiter);
  const dateCol = findCol(headers, DATE_KEYS);
  const labelCol = findCol(headers, LABEL_KEYS);
  const amountCol = findCol(headers, AMOUNT_KEYS);
  const debitCol = findCol(headers, DEBIT_KEYS);
  const creditCol = findCol(headers, CREDIT_KEYS);
  const typeCol = findCol(headers, TYPE_KEYS);

  const headerLooksValid = dateCol >= 0 && (amountCol >= 0 || debitCol >= 0 || creditCol >= 0);
  const rows: ParsedRow[] = [];
  let skipped = 0;
  const start = headerLooksValid ? 1 : 0;

  for (let i = start; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i] ?? "", delimiter);
    const lineNo = i + 1;
    const postedOn = parseDate(cell(cells, headerLooksValid ? dateCol : 0));
    const label = cell(cells, headerLooksValid ? labelCol : 1);
    if (!postedOn || !label || isBalanceRow(label)) {
      skipped++;
      continue;
    }

    let amount: number | null = null;
    if (headerLooksValid && (debitCol >= 0 || creditCol >= 0)) {
      const debit = parseAmount(cell(cells, debitCol));
      const credit = parseAmount(cell(cells, creditCol));
      if (debit == null && credit == null) {
        skipped++;
        continue;
      }
      amount = Math.abs(credit ?? 0) - Math.abs(debit ?? 0);
    } else {
      const rawAmount = cell(cells, headerLooksValid ? amountCol : cells.length - 1);
      amount = parseAmount(rawAmount);
      if (amount != null && headerLooksValid && isDebitType(cell(cells, typeCol))) {
        amount = -Math.abs(amount);
      }
    }

    if (amount == null || amount === 0) {
      skipped++;
      continue;
    }

    rows.push({ lineNo, postedOn, label, amount });
  }

  return { rows, skipped };
}
