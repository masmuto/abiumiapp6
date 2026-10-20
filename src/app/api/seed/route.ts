// API: /api/seed
// Re-seed dari UI: gunakan untuk setup data awal
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DEFAULT_CATEGORIES, DEFAULT_USERS } from "@/lib/constants";

export async function POST() {
  try {
    let created = { users: 0, categories: 0, accounts: 0, assets: 0 };

    // Users
    for (const u of DEFAULT_USERS) {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("name", u.name)
        .maybeSingle();
      if (!existing) {
        await supabase.from("users").insert(u);
        created.users++;
      }
    }

    // Categories
    for (const cat of DEFAULT_CATEGORIES) {
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("name", cat.name)
        .eq("type", cat.type)
        .maybeSingle();
      if (!existing) {
        await supabase.from("categories").insert({ ...cat, is_default: true });
        created.categories++;
      }
    }

    // Accounts (cek apakah ada account sama sekali)
    const { count: acCount } = await supabase
      .from("accounts")
      .select("id", { count: "exact", head: true });
    if ((acCount ?? 0) === 0) {
      await supabase.from("accounts").insert([
        { name: "Tunai Dompet", type: "CASH", initial_balance: 500000, balance: 500000, icon: "💵" },
        { name: "Bank BCA", type: "BANK", initial_balance: 5000000, balance: 5000000, icon: "🏦" },
        { name: "GoPay", type: "EWALLET", initial_balance: 250000, balance: 250000, icon: "📱" },
        { name: "Tabungan Keluarga", type: "SAVINGS", initial_balance: 10000000, balance: 10000000, icon: "🐷" },
        { name: "Lemari Emas", type: "GOLD", initial_balance: 0, balance: 0, icon: "🪙" },
      ]);
      created.accounts = 5;
    }

    // Assets
    const { count: asCount } = await supabase
      .from("assets")
      .select("id", { count: "exact", head: true });
    if ((asCount ?? 0) === 0) {
      await supabase.from("assets").insert([
        { name: "Emas Antam 10gr", type: "GOLD", quantity: 10, unit_price: 1800000, value: 18000000 },
        { name: "Dinar 1 keping", type: "DINAR", quantity: 1, unit_price: 3500000, value: 3500000 },
      ]);
      created.assets = 2;
    }

    return NextResponse.json({ data: created });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
