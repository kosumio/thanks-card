// Generate placeholder employee entries for the 45 unknown names so they
// can appear in rankings and receive cards. Real employee_number to be
// filled in later from 中上課長 confirmation.
//
// For each unique unknown name across all months:
//   - employee_number = `tmp-NNN` (sequential)
//   - location = most common sub-location seen in cards
//   - name_kana = '' (placeholder)
//   - birthdate = 1900-01-01 (unused in current auth)
//   - is_admin = false, is_active = true (so they appear everywhere)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const months = [
  "2026-03","2026-02","2026-01",
  "2025-12","2025-11","2025-10","2025-09",
  "2025-08","2025-07","2025-06","2025-05","2025-04",
];

// Aggregate: name -> { count, locations: {loc: n} }
const map = new Map();
for (const m of months) {
  const p = path.join(__dirname, `unknowns-${m}.json`);
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, "utf-8"));
  for (const u of data) {
    if (!map.has(u.name)) map.set(u.name, { count: 0, locations: {} });
    const a = map.get(u.name);
    a.count += u.count;
    for (const s of u.samples) {
      a.locations[s.rawLocation] = (a.locations[s.rawLocation] || 0) + 1;
    }
  }
}

// Sort by total count desc to assign tmp-NNN in order of importance
const sorted = Array.from(map.entries())
  .map(([name, a]) => {
    const topLoc = Object.entries(a.locations).sort((x, y) => y[1] - x[1])[0][0];
    const sub = topLoc.includes("/") ? topLoc.split("/", 2)[1] : topLoc;
    return { name, count: a.count, location: sub === "0" ? topLoc.split("/")[0] : sub };
  })
  .sort((x, y) => y.count - x.count);

const now = new Date();
const newEntries = sorted.map((s, i) => ({
  employee_number: `tmp-${String(i + 1).padStart(3, "0")}`,
  name: s.name,
  name_kana: "",
  location: s.location,
  birthdate: "1900-01-01",
  is_admin: false,
  // is_active defaults to true at DB layer; explicit here for clarity
}));

// Write new entries to a separate file for safe inspection
fs.writeFileSync(
  path.join(__dirname, "placeholder-employees.json"),
  JSON.stringify(newEntries, null, 2),
  "utf-8"
);

// Also append into employees.json (with dedup by name)
const empPath = path.join(ROOT, "scripts/data/employees.json");
const existing = JSON.parse(fs.readFileSync(empPath, "utf-8"));
const existingNames = new Set(existing.map((e) => e.name));
let added = 0;
for (const e of newEntries) {
  if (!existingNames.has(e.name)) {
    existing.push(e);
    added++;
  }
}
fs.writeFileSync(empPath, JSON.stringify(existing, null, 2), "utf-8");

console.log(`generated ${newEntries.length} placeholder entries`);
console.log(`employees.json: ${existing.length} entries (+${added} new)`);
console.log(`top 10:`);
for (const e of newEntries.slice(0, 10)) {
  console.log(`  ${e.employee_number}  ${e.name}  (${e.location})`);
}
