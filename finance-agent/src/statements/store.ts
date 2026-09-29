import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { getDb } from "../db/index.js";
import { categorizeName } from "../store/planning.js";
import { parseStatementCsv, type ParsedRow } from "./csv.js";

export type ImportResult = {
  source_file: string;
  account_name: string;
  imported: number;
  skipped: number;
  start: string | null;
  end: string | null;
};

export type ImportedTransaction = {
  id: number;
  source_file: string;
  account_name: string;
  posted_on: string;
  label: string;
  amount: number;
  category: string;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function categoryFor(label: string): string {
  return categorizeName(label) ?? "Sans catégorie";
}

function bounds(rows: ParsedRow[]): { start: string | null; end: string | null } {
  if (!rows.length) return { start: null, end: null };
  const dates = rows.map((row) => row.postedOn).sort();
  return { start: dates[0] ?? null, end: dates[dates.length - 1] ?? null };
}

export function importStatementText(input: {
  text: string;
  sourceFile: string;
  accountName?: string;
}): ImportResult {
  const parsed = parseStatementCsv(input.text);
  const accountName = input.accountName?.trim() || "";
  const db = getDb();
  const replace = db.prepare(
    `DELETE FROM imported_transactions WHERE source_file = ?`,
  );
  const insert = db.prepare(
    `INSERT INTO imported_transactions
       (source_file, line_no, account_name, posted_on, label, amount)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  db.exec("BEGIN");
  try {
    replace.run(input.sourceFile);
    for (const row of parsed.rows) {
      insert.run(
        input.sourceFile,
        row.lineNo,
        accountName,
        row.postedOn,
        row.label,
        row.amount,
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  const range = bounds(parsed.rows);
  return {
    source_file: input.sourceFile,
    account_name: accountName,
    imported: parsed.rows.length,
    skipped: parsed.skipped,
    start: range.start,
    end: range.end,
  };
}

export function importStatementFile(
  filePath: string,
  accountName?: string,
): ImportResult {
  const absolute = path.resolve(filePath);
  const text = fs.readFileSync(absolute, "utf8");
  return importStatementText({
    text,
    sourceFile: path.basename(absolute),
    accountName,
  });
}

export function importInbox(accountName?: string): ImportResult[] {
  const dir = config.statementsDir();
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith(".csv"))
    .sort();
  return files.map((name) =>
    importStatementFile(path.join(dir, name), accountName),
  );
}

type TxRow = {
  id: number;
  source_file: string;
  account_name: string;
  posted_on: string;
  label: string;
  amount: number;
};

function mapRow(row: TxRow): ImportedTransaction {
  return { ...row, category: categoryFor(row.label) };
}

export function listImported(input: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): ImportedTransaction[] {
  const where: string[] = [];
  const params: Array<string | number> = [];
  if (input.startDate) {
    where.push("posted_on >= ?");
    params.push(input.startDate);
  }
  if (input.endDate) {
    where.push("posted_on <= ?");
    params.push(input.endDate);
  }
  const sql = `
    SELECT id, source_file, account_name, posted_on, label, amount
    FROM imported_transactions
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY posted_on, id
    LIMIT ?`;
  params.push(input.limit ?? 200);
  const rows = getDb().prepare(sql).all(...params) as TxRow[];
  return rows.map(mapRow);
}

export function listStatementSources(): Array<{
  source_file: string;
  account_name: string;
  operations: number;
  start: string;
  end: string;
}> {
  return getDb()
    .prepare(
      `SELECT source_file, account_name, COUNT(*) AS operations,
              MIN(posted_on) AS start, MAX(posted_on) AS end
       FROM imported_transactions
       GROUP BY source_file, account_name
       ORDER BY end DESC`,
    )
    .all() as Array<{
    source_file: string;
    account_name: string;
    operations: number;
    start: string;
    end: string;
  }>;
}

export function summarizeImported(input: { startDate?: string; endDate?: string }) {
  const transactions = listImported({
    startDate: input.startDate,
    endDate: input.endDate,
    limit: 10000,
  });
  let inflow = 0;
  let outflow = 0;
  const byCategory: Record<string, number> = {};
  const byAccount: Record<string, { inflow: number; outflow: number }> = {};

  for (const tx of transactions) {
    const account = tx.account_name || "Relevé";
    byAccount[account] ??= { inflow: 0, outflow: 0 };
    if (tx.amount > 0) {
      inflow += tx.amount;
      byAccount[account].inflow += tx.amount;
    } else {
      const spent = Math.abs(tx.amount);
      outflow += spent;
      byAccount[account].outflow += spent;
      byCategory[tx.category] = (byCategory[tx.category] ?? 0) + spent;
    }
  }

  const dates = transactions.map((tx) => tx.posted_on).sort();
  return {
    period: {
      start: input.startDate ?? dates[0] ?? null,
      end: input.endDate ?? dates[dates.length - 1] ?? null,
    },
    inflow: round2(inflow),
    outflow: round2(outflow),
    net: round2(inflow - outflow),
    category_breakdown: Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount: round2(amount) }))
      .sort((a, b) => b.amount - a.amount),
    accounts: Object.entries(byAccount).map(([account, totals]) => ({
      account,
      inflow: round2(totals.inflow),
      outflow: round2(totals.outflow),
      net: round2(totals.inflow - totals.outflow),
    })),
    transaction_count: transactions.length,
    source: "releves",
    message: transactions.length
      ? null
      : "Aucune opération. Déposez un export CSV de la banque dans finance-agent/inbox/ puis importez-le.",
  };
}
