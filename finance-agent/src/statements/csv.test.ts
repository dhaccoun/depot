import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parseAmount, parseDate, parseStatementCsv } from "./csv.js";

test("montants français et anglais", () => {
  assert.equal(parseAmount("86,40"), 86.4);
  assert.equal(parseAmount("1 200,00"), 1200);
  assert.equal(parseAmount("1\u00a0200,50"), 1200.5);
  assert.equal(parseAmount("-42.10"), -42.1);
  assert.equal(parseAmount("(12.50)"), -12.5);
  assert.equal(parseAmount("1,234.56"), 1234.56);
  assert.equal(parseAmount(""), null);
});

test("dates françaises par défaut", () => {
  assert.equal(parseDate("03/09/2026"), "2026-09-03");
  assert.equal(parseDate("2026-09-03"), "2026-09-03");
  assert.equal(parseDate("03/15/2026"), "2026-03-15");
});

test("relevé avec débit et crédit", () => {
  const file = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../exemples/releve-exemple.csv",
  );
  const parsed = parseStatementCsv(readFileSync(file, "utf8"));
  assert.equal(parsed.rows.length, 4);
  assert.equal(parsed.rows[0]?.amount, 3200);
  assert.equal(parsed.rows[1]?.amount, -86.4);
  assert.equal(parsed.rows[1]?.postedOn, "2026-09-03");
  assert.ok(parsed.skipped >= 1);
});

test("colonne montant unique", () => {
  const parsed = parseStatementCsv(
    ["date,description,amount", "2026-09-02,CAFE,-4.50", "2026-09-04,VIREMENT,100.00"].join(
      "\n",
    ),
  );
  assert.deepEqual(
    parsed.rows.map((row) => row.amount),
    [-4.5, 100],
  );
});
