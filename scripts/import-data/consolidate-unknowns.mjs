// Aggregate unknowns from unknowns-{YYYY-MM}.json files.
// Output: consolidated-unknowns.md (grouped by name, with count and samples)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const months = [
  "2026-03", "2026-02", "2026-01",
  "2025-12", "2025-11", "2025-10", "2025-09",
  "2025-08", "2025-07", "2025-06", "2025-05", "2025-04",
];

// Combine all unknowns across months
const allUnknowns = new Map(); // name -> { total: n, byMonth: {YYYY-MM: n}, sample: {location, othersSeen: Set} }

for (const month of months) {
  // Support both old (unknowns.json) for 2026-03 and new (unknowns-{month}.json)
  const candidates = [
    path.join(__dirname, `unknowns-${month}.json`),
    ...(month === "2026-03" ? [path.join(__dirname, "unknowns.json")] : []),
  ];
  let data = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      data = JSON.parse(fs.readFileSync(p, "utf-8"));
      break;
    }
  }
  if (!data) continue;
  for (const u of data) {
    if (!allUnknowns.has(u.name)) {
      allUnknowns.set(u.name, {
        total: 0,
        byMonth: {},
        sampleLocations: new Set(),
        othersSeen: new Set(),
      });
    }
    const a = allUnknowns.get(u.name);
    a.total += u.count;
    a.byMonth[month] = (a.byMonth[month] || 0) + u.count;
    for (const s of u.samples) {
      a.sampleLocations.add(s.rawLocation);
      a.othersSeen.add(s.other);
    }
  }
}

const sorted = Array.from(allUnknowns.entries())
  .map(([name, a]) => ({
    name,
    total: a.total,
    months: Object.keys(a.byMonth).sort(),
    locations: Array.from(a.sampleLocations),
    othersSeen: Array.from(a.othersSeen).slice(0, 8),
  }))
  .sort((x, y) => y.total - x.total);

// Group by category
const knownJapanese = [
  "中上征三", "吉村一将", "土田健太", "長谷川弓恵", "齋藤茂",
];
const hakoneStaff = ["香川知世", "石井玲香", "勝又玲子", "杉原絵玲奈"];
const chigasakiStaff = ["佐々木絵里子", "杉原榛夏"];
const foreignNames = /^[ｱ-ﾝァ-ヴ][ｱ-ﾝァ-ヴー\s 　]+$/;

let md = `# サンクスカード 名簿追加確認リスト（中上課長向け）\n\n`;
md += `2025年4月〜2026年3月の1年分サンクスカードをアプリに移行した際、\n`;
md += `名簿（正準社員+PT評価対象者 = 92名）に含まれない名前が出現しました。\n`;
md += `合計 **${sorted.length}名**。各名について以下を教えてください:\n\n`;
md += `- 氏名（フルネーム・正式表記）\n- 従業員番号（ログインに必要）\n\n`;
md += `※ 認証は従業員番号のみに変更したため、生年月日は不要になりました。\n\n`;

const categorize = (name) => {
  if (knownJapanese.includes(name)) return "A. LINEWORKS 登録あり（誕生日のみ要確認）";
  if (hakoneStaff.includes(name)) return "B. 箱根ﾁｰﾃﾗ元箱根店スタッフ（LW未登録）";
  if (chigasakiStaff.includes(name)) return "C. ちがさき倶楽部 / ちがさき関連";
  // Foreign-name heuristic: contains foreign katakana patterns OR spaces between names
  if (/^[\u30a1-\u30ff\s]+$/.test(name) || /\s/.test(name)) return "E. 技能実習生など（カタカナ表記）";
  return "D. その他（日本人スタッフ・名簿漏れ）";
};

const groups = new Map();
for (const u of sorted) {
  const cat = categorize(u.name);
  if (!groups.has(cat)) groups.set(cat, []);
  groups.get(cat).push(u);
}

const catOrder = [
  "A. LINEWORKS 登録あり（誕生日のみ要確認）",
  "B. 箱根ﾁｰﾃﾗ元箱根店スタッフ（LW未登録）",
  "C. ちがさき倶楽部 / ちがさき関連",
  "D. その他（日本人スタッフ・名簿漏れ）",
  "E. 技能実習生など（カタカナ表記）",
];

for (const cat of catOrder) {
  const list = groups.get(cat);
  if (!list || list.length === 0) continue;
  md += `\n## ${cat}（${list.length}名）\n\n`;
  md += `| 氏名 | 件数 | 出現月 | 主な所属（カード上） |\n`;
  md += `|------|------|--------|-----------------------|\n`;
  for (const u of list) {
    const locs = Array.from(new Set(u.locations)).slice(0, 2).join(" / ");
    md += `| ${u.name} | ${u.total} | ${u.months.length}ヶ月 | ${locs} |\n`;
  }
}

md += `\n---\n\n## 確認済み対応\n\n`;
md += `- **10052 土田弓恵 → 長谷川弓恵**（旧姓・LINEWORKSに準拠）\n`;
md += `- **hayashi（林千恵理）アカウントは削除**（一般利用しないため）\n`;
md += `- **役員/部長クラス6名追加**（市川将史 4 / 山川隆之 6 / 吉村一将 10012 / 吉田栄作 10021 / 中上征三 10053 / 緑川好美 10079）\n`;
md += `- **認証方式を従業員番号のみに変更**（生年月日は不要に）\n\n`;
md += `## 不明者の対応方針\n\n`;
md += `生年月日が判明しなくても、各人の **従業員番号** が分かれば名簿追加・カード紐付けが可能です。\n`;
md += `ログインは従業員番号のみなので、確認のお願いは「フルネーム + 従業員番号」だけで十分です。\n`;

fs.writeFileSync(path.join(__dirname, "consolidated-unknowns.md"), md, "utf-8");
console.log(`wrote consolidated-unknowns.md (${sorted.length} unique unknowns)`);
