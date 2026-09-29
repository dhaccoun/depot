import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const dir = mkdtempSync(path.join(tmpdir(), "finance-agent-"));
process.env.DATABASE_PATH = path.join(dir, "planning.db");

const store = await import("./store.js");
const planning = await import("../store/planning.js");

test("importe un relevé et résume le mois", () => {
  const csv = [
    "Date;Libellé;Débit;Crédit",
    "01/09/2026;SALAIRE;;3200,00",
    "03/09/2026;CARREFOUR;86,40;",
    "10/09/2026;LOYER;1200,00;",
  ].join("\n");
  planning.addCategoryRule("carrefour", "Courses");
  const imported = store.importStatementText({
    text: csv,
    sourceFile: "septembre.csv",
    accountName: "Compte courant",
  });
  assert.equal(imported.imported, 3);

  const again = store.importStatementText({
    text: csv,
    sourceFile: "septembre.csv",
    accountName: "Compte courant",
  });
  assert.equal(again.imported, 3);
  assert.equal(store.listStatementSources()[0]?.operations, 3);

  const summary = store.summarizeImported({
    startDate: "2026-09-01",
    endDate: "2026-09-30",
  });
  assert.equal(summary.inflow, 3200);
  assert.equal(summary.outflow, 1286.4);
  assert.equal(summary.net, 1913.6);
  const courses = summary.category_breakdown.find(
    (row) => row.category === "Courses",
  );
  assert.equal(courses?.amount, 86.4);
  assert.equal(summary.transaction_count, 3);
});

test("période vide", () => {
  const summary = store.summarizeImported({
    startDate: "2020-01-01",
    endDate: "2020-01-31",
  });
  assert.equal(summary.transaction_count, 0);
  assert.match(summary.message ?? "", /inbox/);
});

test.after(() => {
  rmSync(dir, { recursive: true, force: true });
});
