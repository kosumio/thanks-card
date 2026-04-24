// scripts/seed-employees.ts
// Run: npx tsx scripts/seed-employees.ts
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
//
// Reads scripts/data/employees.json (gitignored) and:
//   1. Deletes pre-existing test accounts (0001-0005, 9999)
//   2. Upserts all employees from JSON into both `employees` table and Supabase Auth

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
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

// Legacy test accounts to purge before seeding real data
const LEGACY_EMPLOYEE_NUMBERS = ["0001", "0002", "0003", "0004", "0005", "9999"];

function loadEmployees(): EmployeeSeed[] {
  const jsonPath = path.resolve(__dirname, "data/employees.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`[fatal] ${jsonPath} not found. See scripts/data/README.md.`);
    process.exit(1);
  }
  const raw = fs.readFileSync(jsonPath, "utf-8");
  return JSON.parse(raw) as EmployeeSeed[];
}

async function deleteLegacy() {
  console.log("--- purge legacy test accounts ---");
  for (const num of LEGACY_EMPLOYEE_NUMBERS) {
    // Delete auth user first (employees row is referenced by app_metadata.employee_id)
    const email = `${num}@thanks-card.local`;
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users?.users.find((u) => u.email === email);
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id);
      console.log(`[auth delete] ${num}`);
    }
    // Delete employees row
    const { error: empErr } = await supabase
      .from("employees")
      .delete()
      .eq("employee_number", num);
    if (empErr) {
      console.error(`[employees delete] ${num}: ${empErr.message}`);
    } else {
      console.log(`[employees delete] ${num}`);
    }
  }
}

async function seedOne(emp: EmployeeSeed) {
  // 1. employees table UPSERT
  const { data: empRow, error: empErr } = await supabase
    .from("employees")
    .upsert(emp, { onConflict: "employee_number" })
    .select("id, is_admin")
    .single();

  if (empErr) {
    console.error(`[employees] ${emp.name}: ${empErr.message}`);
    return;
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

async function seed() {
  const employees = loadEmployees();
  console.log(
    `--- loaded ${employees.length} employees (admins: ${employees.filter((e) => e.is_admin).length}) ---`
  );

  await deleteLegacy();

  console.log("--- seed begin ---");
  for (const emp of employees) {
    await seedOne(emp);
  }
  console.log("--- seed complete ---");
}

seed().catch(console.error);
