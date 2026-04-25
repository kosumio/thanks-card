import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
(async () => {
  // Use distinct location filters
  const { data: emps } = await s.from("employees").select("employee_number, name, location").eq("is_active", true);
  const all = emps ?? [];
  // アバロン工場関連: 製造課, アバロン*, 品質管理室, 顧問, ｱﾊﾞﾛﾝ営業課
  const avalon = all.filter((e) =>
    /製造課|アバロン|ｱﾊﾞﾛﾝ|品質管理室|顧問/.test(e.location || "")
  );
  console.log(`=== アバロン工場関連: ${avalon.length}名 ===`);
  for (const e of avalon) console.log(`  ${e.employee_number}  ${e.name}  (${e.location})`);

  const saki = all.filter((e) => /崎次郎/.test(e.location || ""));
  console.log(`\n=== 崎次郎関連: ${saki.length}名 ===`);
  for (const e of saki) console.log(`  ${e.employee_number}  ${e.name}  (${e.location})`);
})();
