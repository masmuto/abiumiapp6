// API: /api/restore
// POST — terima JSON backup, upsert semua tabel ke Supabase
// Urutan insert mengikuti foreign key dependencies:
//   1. users (no FK)
//   2. categories (no FK)
//   3. settings (no FK)
//   4. accounts (no FK)
//   5. assets (no FK)
//   6. liabilities (no FK)
//   7. transactions (FK: users, accounts, categories)
//   8. budgets (FK: categories, users)
//
// Mode: merge (default) — upsert by ID, tidak hapus data lain
// Opsi: ?mode=replace — hapus semua data lama dulu, lalu insert baru
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "merge"; // "merge" atau "replace"

    const body = await req.json();

    // Validasi struktur backup
    if (!body || !body.data) {
      return NextResponse.json(
        { error: "Format backup tidak valid: field 'data' tidak ditemukan" },
        { status: 400 }
      );
    }
    const data = body.data;
    const requiredTables = [
      "users",
      "accounts",
      "categories",
      "transactions",
      "budgets",
      "assets",
      "liabilities",
    ];
    for (const t of requiredTables) {
      if (!Array.isArray(data[t])) {
        return NextResponse.json(
          {
            error: `Format backup tidak valid: data.${t} harus array`,
          },
          { status: 400 }
        );
      }
    }

    const result = {
      users: { inserted: 0, updated: 0, errors: [] as string[] },
      categories: { inserted: 0, updated: 0, errors: [] as string[] },
      settings: { inserted: 0, updated: 0, errors: [] as string[] },
      accounts: { inserted: 0, updated: 0, errors: [] as string[] },
      assets: { inserted: 0, updated: 0, errors: [] as string[] },
      liabilities: { inserted: 0, updated: 0, errors: [] as string[] },
      transactions: { inserted: 0, updated: 0, errors: [] as string[] },
      budgets: { inserted: 0, updated: 0, errors: [] as string[] },
    };

    // === MODE: replace — hapus semua data lama dulu (urutan terbalik untuk FK) ===
    if (mode === "replace") {
      console.log("[restore] Mode replace: menghapus data lama...");
      const deleteOrder = [
        "budgets",
        "transactions",
        "liabilities",
        "assets",
        "accounts",
        "categories",
        "users",
        "settings",
      ];
      for (const table of deleteOrder) {
        const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) {
          console.warn(`[restore] Gagal hapus ${table}:`, error.message);
        }
      }
    }

    // === Helper: upsert array ke tabel ===
    const upsertArray = async (
      table: string,
      rows: any[],
      conflictField: string = "id"
    ) => {
      let inserted = 0;
      let updated = 0;
      const errors: string[] = [];
      for (const row of rows) {
        const { data: existing } = await supabase
          .from(table)
          .select("id")
          .eq(conflictField, row[conflictField])
          .maybeSingle();
        const { error } = await supabase
          .from(table)
          .upsert(row, { onConflict: conflictField });
        if (error) {
          errors.push(`${row[conflictField] || "(no id)"}: ${error.message}`);
        } else if (existing) {
          updated++;
        } else {
          inserted++;
        }
      }
      return { inserted, updated, errors };
    };

    // === Insert dengan urutan FK yang benar ===

    // 1. users (no FK)
    if (data.users?.length > 0) {
      const r = await upsertArray("users", data.users);
      result.users = r;
    }

    // 2. categories (no FK)
    if (data.categories?.length > 0) {
      const r = await upsertArray("categories", data.categories);
      result.categories = r;
    }

    // 3. settings (no FK, optional)
    if (data.settings?.length > 0) {
      const r = await upsertArray("settings", data.settings);
      result.settings = r;
    }

    // 4. accounts (no FK)
    if (data.accounts?.length > 0) {
      const r = await upsertArray("accounts", data.accounts);
      result.accounts = r;
    }

    // 5. assets (no FK)
    if (data.assets?.length > 0) {
      const r = await upsertArray("assets", data.assets);
      result.assets = r;
    }

    // 6. liabilities (no FK)
    if (data.liabilities?.length > 0) {
      const r = await upsertArray("liabilities", data.liabilities);
      result.liabilities = r;
    }

    // 7. transactions (FK: users, accounts, categories)
    if (data.transactions?.length > 0) {
      const r = await upsertArray("transactions", data.transactions);
      result.transactions = r;
    }

    // 8. budgets (FK: categories, users)
    if (data.budgets?.length > 0) {
      const r = await upsertArray("budgets", data.budgets);
      result.budgets = r;
    }

    // Summary
    const summary = {
      mode,
      restored: true,
      restoredAt: new Date().toISOString(),
      backupVersion: body.version ?? "unknown",
      backupExportedAt: body.exportedAt ?? "unknown",
      totalRows: {
        users: data.users.length,
        categories: data.categories.length,
        accounts: data.accounts.length,
        transactions: data.transactions.length,
        budgets: data.budgets.length,
        assets: data.assets.length,
        liabilities: data.liabilities.length,
      },
      perTable: result,
      errors: Object.entries(result).filter(([_, v]: any) => v.errors?.length > 0).length,
    };

    return NextResponse.json({ data: summary });
  } catch (e: any) {
    console.error("POST /api/restore error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
