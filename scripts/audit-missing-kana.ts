/**
 * 読み仮名（name_kana）が空 or 名前と同一（実質欠損）な従業員を抽出する。
 * 出力: clients/AWB/2026-04-27_thanks-card-missing-kana.md（手動補完用）
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  const { data, error } = await s
    .from("employees")
    .select("id, employee_number, name, name_kana, location, is_active")
    .order("location")
    .order("name");

  if (error) throw error;
  const all = data ?? [];

  // ひらがな(U+3041-U+309F) / カタカナ(U+30A0-U+30FF) / 長音(U+30FC) / スペース のみ
  const isHiraganaKatakana = (str: string) =>
    /^[ぁ-ゟ゠-ヿ\s]+$/.test(str);

  const missing = all.filter((e) => {
    if (!e.is_active) return false;
    if (!e.name_kana || e.name_kana.trim() === "") return true;
    // 名前と読み仮名が完全一致＝かなが入っていない（漢字が入っている）
    if (e.name_kana.trim() === e.name.trim() && !isHiraganaKatakana(e.name)) return true;
    if (!isHiraganaKatakana(e.name_kana)) return true;
    return false;
  });

  console.log(`active employees: ${all.filter((e) => e.is_active).length}`);
  console.log(`missing/invalid kana: ${missing.length}`);

  const lines: string[] = [];
  lines.push("# サンクスカード 読み仮名 欠損リスト");
  lines.push("");
  lines.push(`抽出日: 2026-04-27`);
  lines.push(`対象: thanks-card 本番DB / is_active=true 従業員のうち name_kana が空・漢字混入・名前と同一のもの`);
  lines.push("");
  lines.push(`合計: ${missing.length} 名`);
  lines.push("");
  lines.push("| 拠点 | 従業員番号 | 氏名 | 現在の name_kana | 補完用（記入欄） |");
  lines.push("|------|-----------|------|----------------|----------------|");
  for (const e of missing) {
    lines.push(
      `| ${e.location} | ${e.employee_number} | ${e.name} | ${e.name_kana || "(空)"} | |`
    );
  }
  lines.push("");
  lines.push("## 補完手順");
  lines.push("");
  lines.push("1. 右端の「補完用」列にひらがなで読み仮名を記入");
  lines.push("2. 記入後ファイルを角田に渡すと scripts/seed-employees.ts 等で一括 update");
  lines.push("3. HRBrain / LINEWORKS で拾えるものは事前に自動補完予定");

  const outDir = path.resolve("../../../clients/AWB");
  if (!fs.existsSync(outDir)) {
    console.warn(`[warn] output dir not found: ${outDir} -- writing to scripts/data/ instead`);
    const fallback = path.resolve("scripts/data/2026-04-27_missing-kana.md");
    fs.writeFileSync(fallback, lines.join("\n"));
    console.log(`written: ${fallback}`);
  } else {
    const out = path.join(outDir, "2026-04-27_thanks-card-missing-kana.md");
    fs.writeFileSync(out, lines.join("\n"));
    console.log(`written: ${out}`);
  }
})();
