import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
(async () => {
  for (const num of ["sumita", "10079", "10053", "10020"]) {
    const { data, error } = await anon.auth.signInWithPassword({
      email: `${num}@thanks-card.local`,
      password: `tc_${num}`,
    });
    console.log(`  ${num}: ${data?.user?.id ? "OK" : "FAIL"} ${error?.message ?? ""}`);
  }
})();
