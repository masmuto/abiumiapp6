// API: /api/budgets
// Anggaran bulanan per kategori
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    let query = supabase
      .from("budgets")
      .select("*, category:category_id(*), user:user_id(*)")
      .order("year", { ascending: false })
      .order("month", { ascending: false });
    if (month) query = query.eq("month", parseInt(month, 10));
    if (year) query = query.eq("year", parseInt(year, 10));

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message, hint: "Jalankan SQL migration" }, { status: 500 });
    }
    // Map ke camelCase
    const mapped = (data ?? []).map((b: any) => ({
      ...b,
      categoryId: b.category_id,
      userId: b.user_id,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));
    return NextResponse.json({ data: mapped });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { month, year, amount, categoryId, userId } = body;
    if (!month || !year || !amount || !categoryId || !userId) {
      return NextResponse.json(
        { error: "Bulan, tahun, nominal, kategori & user wajib" },
        { status: 400 }
      );
    }

    // Upsert by unique (month, year, category_id)
    const { data: existing } = await supabase
      .from("budgets")
      .select("id, spent")
      .eq("month", month)
      .eq("year", year)
      .eq("category_id", categoryId)
      .maybeSingle();

    let result: any;
    if (existing) {
      const { data, error } = await supabase
        .from("budgets")
        .update({
          amount: Math.round(amount),
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*, category:category_id(*), user:user_id(*)")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      result = { ...data, categoryId: data.category_id, userId: data.user_id, createdAt: data.created_at, updatedAt: data.updated_at };
    } else {
      const { data, error } = await supabase
        .from("budgets")
        .insert({
          month,
          year,
          amount: Math.round(amount),
          category_id: categoryId,
          user_id: userId,
        })
        .select("*, category:category_id(*), user:user_id(*)")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      result = { ...data, categoryId: data.category_id, userId: data.user_id, createdAt: data.created_at, updatedAt: data.updated_at };
    }

    // Recalculate spent dari transaksi EXPENSE bulan ini
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 1).toISOString();
    const { data: txs } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "EXPENSE")
      .eq("category_id", categoryId)
      .gte("date", start)
      .lt("date", end);
    const spent = (txs ?? []).reduce((s, t: any) => s + t.amount, 0);

    const { data: updated } = await supabase
      .from("budgets")
      .update({ spent, updated_at: new Date().toISOString() })
      .eq("id", result.id)
      .select("*, category:category_id(*), user:user_id(*)")
      .single();
    if (updated) {
      result = { ...updated, categoryId: updated.category_id, userId: updated.user_id, createdAt: updated.created_at, updatedAt: updated.updated_at };
    }

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
