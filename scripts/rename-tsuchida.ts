// Rename 10052 土田弓恵 → 長谷川弓恵 (LINEWORKS に揃える / 旧姓へ)
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  const { data, error } = await supabase
    .from("employees")
    .update({ name: "長谷川弓恵", name_kana: "はせがわ ゆみえ" })
    .eq("employee_number", "10052")
    .select("employee_number, name, name_kana, location")
    .single();
  console.log("result:", data, "err:", error?.message);
})();
