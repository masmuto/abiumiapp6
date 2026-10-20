// API: /api/backup
// GET — dump semua tabel Supabase sebagai JSON untuk diunduh user
// Format: { version, exportedAt, source, data: { users, accounts, ... } }
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Fetch semua tabel secara paralel
    const [
      usersRes,
      accountsRes,
      categoriesRes,
      transactionsRes,
      budgetsRes,
      assetsRes,
      liabilitiesRes,
      settingsRes,
    ] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("accounts").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("transactions").select("*"),
      supabase.from("budgets").select("*"),
      supabase.from("assets").select("*"),
      supabase.from("liabilities").select("*"),
      supabase.from("settings").select("*"),
    ]);

    // Cek error
    const errors = [
      usersRes.error,
      accountsRes.error,
      categoriesRes.error,
      transactionsRes.error,
      budgetsRes.error,
      assetsRes.error,
      liabilitiesRes.error,
      settingsRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Gagal backup: " + (errors[0] as any).message,
          hint: "Jalankan SQL migration di Supabase Dashboard dulu",
        },
        { status: 500 }
      );
    }

    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      source: "supabase",
      sourceUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      stats: {
        users: usersRes.data?.length ?? 0,
        accounts: accountsRes.data?.length ?? 0,
        categories: categoriesRes.data?.length ?? 0,
        transactions: transactionsRes.data?.length ?? 0,
        budgets: budgetsRes.data?.length ?? 0,
        assets: assetsRes.data?.length ?? 0,
        liabilities: liabilitiesRes.data?.length ?? 0,
        settings: settingsRes.data?.length ?? 0,
      },
      data: {
        users: usersRes.data ?? [],
        accounts: accountsRes.data ?? [],
        categories: categoriesRes.data ?? [],
        transactions: transactionsRes.data ?? [],
        budgets: budgetsRes.data ?? [],
        assets: assetsRes.data ?? [],
        liabilities: liabilitiesRes.data ?? [],
        settings: settingsRes.data ?? [],
      },
    };

    return NextResponse.json(backup, {
      headers: {
        // Beri nama file default saat diunduh
        "Content-Disposition": `attachment; filename="backup-keuangan-${new Date()
          .toISOString()
          .slice(0, 10)}.json"`,
      },
    });
  } catch (e: any) {
    console.error("GET /api/backup error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
