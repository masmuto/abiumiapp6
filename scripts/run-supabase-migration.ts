// Script: jalankan SQL migration ke Supabase via REST API
// Pakai Supabase Management API atau pg_connection
// Cara: bun run scripts/run-supabase-migration.ts
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = "https://mtgmwgawjcscgammixnu.supabase.co";
const SUPABASE_KEY =
  "sb_publishable_fSKXWTnILil05GBtKH_WkA_sx7fvOzm";

// Anon key TIDAK BISA menjalankan DDL (CREATE TABLE, ALTER, dll).
// Untuk DDL, butuh service_role key atau jalankan manual di Dashboard.
// Script ini hanya VERIFIKASI: cek apakah tabel sudah ada via PostgREST.

async function main() {
  console.log("🔍 Verifikasi koneksi Supabase...");
  console.log("   URL:", SUPABASE_URL);

  // Test 1: Health check
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    console.log("   [Health]", r.status, r.statusText);
  } catch (e: any) {
    console.error("   [Health] FAIL:", e.message);
  }

  // Test 2: Cek tabel users
  console.log("\n📊 Cek tabel yang sudah ada:");
  for (const table of [
    "users",
    "accounts",
    "categories",
    "transactions",
    "budgets",
    "assets",
    "liabilities",
  ]) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count&limit=1`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Profile": "public",
          Prefer: "count=exact",
        },
      });
      if (r.ok) {
        const total = r.headers.get("content-range");
        console.log(`   ✓ ${table}: ${r.status} OK ${total ? "(" + total + ")" : ""}`);
      } else {
        const err = await r.text();
        console.log(
          `   ✗ ${table}: ${r.status} - ${err.substring(0, 100)}`
        );
      }
    } catch (e: any) {
      console.log(`   ✗ ${table}: network error - ${e.message}`);
    }
  }

  console.log(
    "\n📌 CATATAN PENTING:\n" +
      "   Anon/publishable key TIDAK BISA menjalankan DDL (CREATE TABLE, dll).\n" +
      "   Untuk setup awal, jalankan scripts/supabase-schema.sql MANUAL di:\n" +
      "   Supabase Dashboard → SQL Editor → Paste → Run\n" +
      "   Setelah tabel ada, app langsung bisa pakai anon key untuk CRUD."
  );

  // Baca file SQL untuk display
  const sqlPath = join(process.cwd(), "scripts/supabase-schema.sql");
  const sql = readFileSync(sqlPath, "utf-8");
  console.log(`\n📄 File SQL siap di: ${sqlPath}`);
  console.log(`   Total ${sql.split(";").length} statements`);
}

main().catch(console.error);
