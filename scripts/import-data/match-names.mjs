// Dry-run matcher: parse 2026-03-cards.tsv, normalize names, match against
// employees.json, output:
//   - matched.json : cards where both from/to resolved
//   - unknowns.json : grouped list of names not in roster (for 中上課長 check)
//   - summary to stdout

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const tsv = fs.readFileSync(path.join(__dirname, "2026-03-cards.tsv"), "utf-8");
const employees = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/data/employees.json"), "utf-8")
);

// Normalize a name for matching: strip all whitespace + full-width spaces
function norm(s) {
  if (!s) return "";
  return s
    .replace(/[\s\u3000]/g, "")
    // Some Excel sources have 﨑 <-> 崎 variants
    .replace(/﨑/g, "崎")
    .replace(/\u3000/g, "");
}

// Build lookup index: normalized name -> employee
const byName = new Map();
for (const e of employees) {
  byName.set(norm(e.name), e);
}

const cards = [];
const unknownsSet = new Map(); // name -> { samples: [{direction, other_name, location}] }

function addUnknown(name, rawLocation, direction, other) {
  if (!unknownsSet.has(name)) {
    unknownsSet.set(name, { samples: [] });
  }
  unknownsSet.get(name).samples.push({ direction, rawLocation, other });
}

const lines = tsv.split("\n").map((l) => l.trim()).filter(Boolean);
for (const [i, line] of lines.entries()) {
  const cols = line.split("\t");
  if (cols.length < 9) {
    console.error(`line ${i + 1}: only ${cols.length} cols, skipped`);
    continue;
  }
  const [toCo, toDept, toName, , msg, fromCo, fromDept, fromName] = cols;

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
    message_over_200: msg.length > 200,
  });
}

const matched = cards.filter((c) => c.matched.to && c.matched.from);
const unmatched = cards.filter((c) => !c.matched.to || !c.matched.from);
const overLimit = cards.filter((c) => c.message_over_200);

fs.writeFileSync(
  path.join(__dirname, "matched.json"),
  JSON.stringify(matched, null, 2),
  "utf-8"
);

const unknowns = Array.from(unknownsSet.entries())
  .map(([name, info]) => ({ name, count: info.samples.length, samples: info.samples }))
  .sort((a, b) => b.count - a.count);

fs.writeFileSync(
  path.join(__dirname, "unknowns.json"),
  JSON.stringify(unknowns, null, 2),
  "utf-8"
);

console.log(`parsed lines: ${lines.length}`);
console.log(`fully matched: ${matched.length}`);
console.log(`has unknown: ${unmatched.length}`);
console.log(`unique unknown names: ${unknowns.length}`);
console.log(`messages > 200 chars: ${overLimit.length}`);
console.log("");
console.log("--- unknown names (for 中上課長 confirmation) ---");
for (const u of unknowns) {
  const roles = u.samples
    .map((s) => `${s.direction}@${s.rawLocation}(相手=${s.other})`)
    .join(" / ");
  console.log(`  ${u.name}  [${u.count}件]  ${roles}`);
}
if (overLimit.length > 0) {
  console.log("");
  console.log("--- messages over 200 chars (schema limit) ---");
  for (const c of overLimit) {
    console.log(`  line ${c.line}: ${c.message_length}chars`);
  }
}
