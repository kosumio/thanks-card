// Add 6 employees provided by 角田 on 2026-04-25.
// Birthdate is placeholder (1900-01-01) and is_active=false until 中上課長
// confirms real birthdates. Login is blocked but cards can be linked.

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const PLACEHOLDER_BD = "1900-01-01";

const newEmployees = [
  { employee_number: "4",     name: "市川将史", name_kana: "いちかわ まさし", location: "鮑屋本社" },
  { employee_number: "6",     name: "山川隆之", name_kana: "やまかわ たかゆき", location: "鮑屋本社" },
  { employee_number: "10012", name: "吉村一将", name_kana: "よしむら かずまさ", location: "営業二部" },
  { employee_number: "10021", name: "吉田栄作", name_kana: "よしだ えいさく", location: "アバロン工場" },
  { employee_number: "10053", name: "中上征三", name_kana: "なかがみ せいぞう", location: "AWABIYA HD" },
  { employee_number: "10079", name: "緑川好美", name_kana: "みどりかわ よしみ", location: "経営企画室" },
];

(async () => {
  for (const e of newEmployees) {
    const { data, error } = await supabase
      .from("employees")
      .upsert(
        {
          ...e,
          birthdate: PLACEHOLDER_BD,
          is_admin: false,
          is_active: false, // placeholder — login blocked until birthdate confirmed
        },
        { onConflict: "employee_number" }
      )
      .select("employee_number, name, location, is_active")
      .single();
    console.log(error ? `[err] ${e.name}: ${error.message}` : `[ok ] ${data?.employee_number} ${data?.name} active=${data?.is_active}`);
  }

  const { count: total } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true });
  const { count: active } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  console.log(`employees total=${total} active=${active}`);
})();
