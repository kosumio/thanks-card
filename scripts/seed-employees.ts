// scripts/seed-employees.ts
// Run: npx tsx scripts/seed-employees.ts
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface EmployeeSeed {
  employee_number: string;
  name: string;
  name_kana: string;
  location: string;
  birthdate: string;
  is_admin: boolean;
}

const testEmployees: EmployeeSeed[] = [
  { employee_number: "0001", name: "緑川 好美", name_kana: "みどりかわ よしみ", location: "HD", birthdate: "1900-01-01", is_admin: true },
  { employee_number: "0002", name: "松嶋 課長", name_kana: "まつしま かちょう", location: "本社", birthdate: "1900-01-01", is_admin: false },
  { employee_number: "0003", name: "中上 課長", name_kana: "なかがみ かちょう", location: "HD", birthdate: "1900-01-01", is_admin: false },
  { employee_number: "0004", name: "岩﨑 課長", name_kana: "いわさき かちょう", location: "本社", birthdate: "1900-01-01", is_admin: false },
  { employee_number: "0005", name: "和田 課長", name_kana: "わだ かちょう", location: "本社", birthdate: "1900-01-01", is_admin: false },
  { employee_number: "9999", name: "テスト太郎", name_kana: "てすと たろう", location: "本社", birthdate: "1990-01-15", is_admin: true },
];

async function seed() {
  for (const emp of testEmployees) {
    // 1. employees table UPSERT
    const { data: empRow, error: empErr } = await supabase
      .from("employees")
      .upsert(emp, { onConflict: "employee_number" })
      .select("id, is_admin")
      .single();

    if (empErr) {
      console.error(`[employees] ${emp.name}: ${empErr.message}`);
      continue;
    }

    // 2. Create Supabase Auth user (or update existing)
    const email = `${emp.employee_number}@thanks-card.local`;
    const password = `tc_${emp.birthdate}_${emp.employee_number}`;

    const { error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        employee_id: empRow.id,
        is_admin: empRow.is_admin,
      },
    });

    if (authErr) {
      if (authErr.message.includes("already been registered")) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users?.users.find((u) => u.email === email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, {
            password,
            app_metadata: {
              employee_id: empRow.id,
              is_admin: empRow.is_admin,
            },
          });
          console.log(`[update] ${emp.name} (${emp.employee_number})`);
        }
      } else {
        console.error(`[auth] ${emp.name}: ${authErr.message}`);
      }
    } else {
      console.log(`[create] ${emp.name} (${emp.employee_number})`);
    }
  }

  console.log("--- seed complete ---");
}

seed().catch(console.error);
