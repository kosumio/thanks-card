// scripts/apply-schema.mjs
// Supabase に DDL を直接適用するスクリプト
// Run: node scripts/apply-schema.mjs

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const client = new pg.Client({
  connectionString:
    "postgresql://postgres:-_5heGj,XXUabfK@db.lcljeszqzmwmdvnhechf.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL");

  const files = ["supabase/schema.sql", "supabase/policies.sql", "supabase/seed.sql"];

  for (const file of files) {
    const sql = fs.readFileSync(path.join(root, file), "utf-8");
    console.log(`\nExecuting ${file}...`);
    try {
      await client.query(sql);
      console.log(`  ✓ ${file} applied successfully`);
    } catch (err) {
      console.error(`  ✗ ${file} failed:`, err.message);
    }
  }

  await client.end();
  console.log("\nDone.");
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
