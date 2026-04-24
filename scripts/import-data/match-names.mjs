// Dry-run matcher: parse {YYYY-MM}-cards.tsv, normalize names, match against
// employees.json, output:
//   - matched-{YYYY-MM}.json
//   - unknowns-{YYYY-MM}.json
// Usage: node scripts/import-data/match-names.mjs 2026-03

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const month = process.argv[2];
if (!month || !/^\d{4}-\d{2}$/.test(month)) {
  console.error("Usage: node match-names.mjs YYYY-MM");
  process.exit(1);
}

const tsvPath = path.join(__dirname, `${month}-cards.tsv`);
if (!fs.existsSync(tsvPath)) {
  console.error(`file not found: ${tsvPath}`);
  process.exit(1);
}

const tsv = fs.readFileSync(tsvPath, "utf-8");
const employees = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/data/employees.json"), "utf-8")
);

function norm(s) {
  if (!s) return "";
  return s.replace(/[\s\u3000]/g, "").replace(/﨑/g, "崎");
}

const byName = new Map();
for (const e of employees) byName.set(norm(e.name), e);

const cards = [];
const unknownsSet = new Map();
function addUnknown(name, rawLoc, dir, other) {
  if (!unknownsSet.has(name)) unknownsSet.set(name, { samples: [] });
  unknownsSet.get(name).samples.push({ direction: dir, rawLocation: rawLoc, other });
}

const lines = tsv.split("\n").map((l) => l.trimEnd()).filter(Boolean);
let skipped = 0;
for (const [i, line] of lines.entries()) {
  const cols = line.split("\t");
  if (cols.length < 9) {
    skipped++;
    continue;
  }
  const [toCo, toDept, toName, , msg, fromCo, fromDept, fromName] = cols;
  // Skip rows with #CALC! (broken Excel formulas)
  if (toName === "#CALC!" || fromName === "#CALC!" || !toName || !fromName || !msg) {
    skipped++;
    continue;
  }
  const toEmp = byName.get(norm(toName));
  const fromEmp = byName.get(norm(fromName));
  if (!toEmp) addUnknown(toName, `${toCo}/${toDept}`, "to", fromName);
  if (!fromEmp) addUnknown(fromName, `${fromCo}/${fromDept}`, "from", toName);
  cards.push({
    line: i + 1,
    to_raw: { company: toCo, dept: toDept, name: toName },
    from_raw: { company: fromCo, dept: fromDept, name: fromName },
    message: msg,
    matched: {
      to: toEmp ? { id: toEmp.employee_number, name: toEmp.name } : null,
      from: fromEmp ? { id: fromEmp.employee_number, name: fromEmp.name } : null,
    },
    message_length: msg.length,
  });
}

const matched = cards.filter((c) => c.matched.to && c.matched.from);
const unmatched = cards.filter((c) => !c.matched.to || !c.matched.from);
const overLimit = cards.filter((c) => c.message_length > 200);

fs.writeFileSync(
  path.join(__dirname, `matched-${month}.json`),
  JSON.stringify(matched, null, 2),
  "utf-8"
);

const unknowns = Array.from(unknownsSet.entries())
  .map(([name, info]) => ({ name, count: info.samples.length, samples: info.samples }))
  .sort((a, b) => b.count - a.count);
fs.writeFileSync(
  path.join(__dirname, `unknowns-${month}.json`),
  JSON.stringify(unknowns, null, 2),
  "utf-8"
);

console.log(`[${month}] parsed: ${lines.length}  skipped: ${skipped}  matched: ${matched.length}  unmatched: ${unmatched.length}  uniq-unknown: ${unknowns.length}  overLimit: ${overLimit.length}`);
