// API: /api (health check + status Supabase)
import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const status: any = {
    ok: true,
    service: "Aplikasi Keuangan Keluarga",
    supabaseConfigured: isSupabaseConfigured,
    stats: {},
  };

  if (isSupabaseConfigured) {
    try {
      // Coba SELECT biasa (bukan head:true) — kalau tabel tidak ada,
      // PostgREST akan kembalikan error PGRST205.
      const { data: users, error: userErr } = await supabase
        .from("users")
        .select("id, name")
        .limit(1);

      if (userErr) {
        // Tabel belum ada — user perlu run SQL migration
        status.stats = {
          needsMigration: true,
          migrationHint:
            "Tabel belum ada di Supabase. Jalankan scripts/supabase-schema.sql di Supabase Dashboard → SQL Editor.",
          error: userErr.message,
          code: userErr.code,
        };
      } else {
        // Tabel ada — fetch semua count
        const [
          { count: accountCount },
          { count: categoryCount },
          { count: transactionCount },
          { count: assetCount },
          { count: liabilityCount },
        ] = await Promise.all([
          supabase.from("accounts").select("id", { count: "exact", head: true }),
          supabase.from("categories").select("id", { count: "exact", head: true }),
          supabase.from("transactions").select("id", { count: "exact", head: true }),
          supabase.from("assets").select("id", { count: "exact", head: true }),
          supabase.from("liabilities").select("id", { count: "exact", head: true }),
        ]);
        status.stats = {
          userCount: users?.length ?? 0,
          accountCount: accountCount ?? 0,
          categoryCount: categoryCount ?? 0,
          transactionCount: transactionCount ?? 0,
          assetCount: assetCount ?? 0,
          liabilityCount: liabilityCount ?? 0,
          connected: true,
        };
      }
    } catch (e: any) {
      status.stats = { error: e.message };
    }
  }

  return NextResponse.json(status);
}
