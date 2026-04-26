/**
 * 読み仮名（name_kana）一括 import スクリプト
 *
 * 入力形式：CSV または TSV、ヘッダ行付き、UTF-8
 *   employee_number,name_kana
 *   10026,むらやまあつし
 *   ...
 *
 * 使い方：
 *   npx tsx scripts/import-name-kana.ts <csv-path>
 *   npx tsx scripts/import-name-kana.ts scripts/data/name-kana.csv
 *
 * - 既存 employees レコードを employee_number で照合し name_kana のみ update
 * - ひらがな/カタカナ以外が混入していた場合は警告して skip
 * - 該当 employee_number が見つからない行は警告
 * - 安全のため auth テーブルには触れない
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const KANA_REGEX = /^[ぁ-ゟ゠-ヿ\s]+$/;

interface Row {
  employee_number: string;
  name_kana: string;
  raw_line: number;
}

function parseCsv(content: string): Row[] {
  // CSV と TSV の両対応（タブ優先）
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const sep = lines[0].includes("\t") ? "\t" : ",";
  const header = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
  const numIdx = header.indexOf("employee_number");
  const kanaIdx = header.indexOf("name_kana");
  if (numIdx < 0 || kanaIdx < 0) {
    throw new Error(
      `header must include 'employee_number' and 'name_kana'. got: ${header.join(", ")}`
    );
  }

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const num = cols[numIdx];
    const kana = cols[kanaIdx];
    if (!num) continue;
    rows.push({ employee_number: num, name_kana: kana, raw_line: i + 1 });
  }
  return rows;
}

(async () => {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("usage: npx tsx scripts/import-name-kana.ts <csv-path>");
    process.exit(1);
  }
  if (!fs.existsSync(csvPath)) {
    console.error(`file not found: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(content);
  console.log(`parsed ${rows.length} rows from ${csvPath}`);

  const { data: emps, error: empErr } = await s
    .from("employees")
    .select("id, employee_number, name, name_kana");
  if (empErr) throw empErr;
  const empByNum = new Map(
    (emps ?? []).map((e) => [e.employee_number, e])
  );

  let updated = 0;
  let skippedNotFound = 0;
  let skippedInvalid = 0;
  let skippedSame = 0;

  for (const r of rows) {
    if (!r.name_kana) {
      console.warn(`[L${r.raw_line}] empty name_kana for ${r.employee_number}, skip`);
      skippedInvalid++;
      continue;
    }
    if (!KANA_REGEX.test(r.name_kana)) {
      console.warn(
        `[L${r.raw_line}] invalid kana for ${r.employee_number}: "${r.name_kana}", skip`
      );
      skippedInvalid++;
      continue;
    }
    const emp = empByNum.get(r.employee_number);
    if (!emp) {
      console.warn(
        `[L${r.raw_line}] employee_number not found: ${r.employee_number}, skip`
      );
      skippedNotFound++;
      continue;
    }
    if (emp.name_kana === r.name_kana) {
      skippedSame++;
      continue;
    }

    const { error: updErr } = await s
      .from("employees")
      .update({ name_kana: r.name_kana, updated_at: new Date().toISOString() })
      .eq("id", emp.id);
    if (updErr) {
      console.error(`[update fail] ${emp.name} (${r.employee_number}): ${updErr.message}`);
      continue;
    }
    console.log(`[ok] ${emp.name} (${r.employee_number}) -> ${r.name_kana}`);
    updated++;
  }

  console.log("");
  console.log(`=== summary ===`);
  console.log(`  updated:           ${updated}`);
  console.log(`  unchanged (same):  ${skippedSame}`);
  console.log(`  not found in DB:   ${skippedNotFound}`);
  console.log(`  invalid kana:      ${skippedInvalid}`);
})();
