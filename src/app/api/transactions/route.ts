// API: /api/transactions
// CRUD transaksi via Supabase — auto-update saldo via RPC function
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/transactions?month=&year=&type=&accountId=&categoryId=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const type = searchParams.get("type");
    const accountId = searchParams.get("accountId");
    const categoryId = searchParams.get("categoryId");
    const limit = searchParams.get("limit");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = supabase
      .from("transactions")
      .select(
        "*, user:user_id(*), account:account_id(*), category:category_id(*), toAccount:to_account_id(*)"
      )
      .order("date", { ascending: false });

    if (type) query = query.eq("type", type);
    if (accountId) query = query.eq("account_id", accountId);
    if (categoryId) query = query.eq("category_id", categoryId);

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0).toISOString();
      const end = new Date(y, m, 1, 0, 0, 0, 0).toISOString();
      query = query.gte("date", start).lt("date", end);
    } else if (from && to) {
      query = query
        .gte("date", new Date(from + "T00:00:00").toISOString())
        .lt("date", new Date(to + "T23:59:59").toISOString());
    }

    if (limit) query = query.limit(parseInt(limit, 10));

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: "Supabase error: " + error.message, hint: "Apakah SQL migration sudah dijalankan di Supabase Dashboard?" },
        { status: 500 }
      );
    }

    // Map snake_case ke camelCase untuk kompatibilitas dengan UI
    const mapped = (data ?? []).map((t: any) => ({
      ...t,
      userId: t.user_id,
      accountId: t.account_id,
      categoryId: t.category_id,
      toAccountId: t.to_account_id,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    return NextResponse.json({ data: mapped });
  } catch (e: any) {
    console.error("GET /api/transactions error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/transactions — panggil RPC record_transaction untuk atomic saldo update
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, type, amount, note, userId, accountId, categoryId, toAccountId } = body;

    if (!date || !type || !amount || !userId || !accountId) {
      return NextResponse.json(
        { error: "Field wajib: date, type, amount, userId, accountId" },
        { status: 400 }
      );
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "Nominal harus > 0" }, { status: 400 });
    }
    if (type === "TRANSFER" && !toAccountId) {
      return NextResponse.json(
        { error: "Transfer wajib ada rekening tujuan" },
        { status: 400 }
      );
    }
    if (type === "TRANSFER" && accountId === toAccountId) {
      return NextResponse.json(
        { error: "Rekening sumber & tujuan tidak boleh sama" },
        { status: 400 }
      );
    }
    if ((type === "INCOME" || type === "EXPENSE") && !categoryId) {
      return NextResponse.json(
        { error: "Pemasukan/pengeluaran wajib ada kategori" },
        { status: 400 }
      );
    }

    // Panggil RPC untuk insert + auto-update saldo dalam satu transaksi DB
    const { data: txId, error } = await supabase.rpc("record_transaction", {
      p_date: new Date(date + "T00:00:00").toISOString(),
      p_type: type,
      p_amount: Math.round(amount),
      p_note: note?.trim() || null,
      p_user_id: userId,
      p_account_id: accountId,
      p_category_id: type === "TRANSFER" ? null : categoryId,
      p_to_account_id: type === "TRANSFER" ? toAccountId : null,
    });

    if (error) {
      return NextResponse.json(
        { error: "Supabase RPC error: " + error.message },
        { status: 500 }
      );
    }

    // Fetch ulang dengan relasi untuk response
    const { data: fullTx, error: fetchErr } = await supabase
      .from("transactions")
      .select(
        "*, user:user_id(*), account:account_id(*), category:category_id(*), toAccount:to_account_id(*)"
      )
      .eq("id", txId)
      .single();

    if (fetchErr) {
      // Transaksi tetap tersimpan, hanya gagal fetch detail
      return NextResponse.json({ data: { id: txId } }, { status: 201 });
    }

    const mapped = {
      ...fullTx,
      userId: fullTx.user_id,
      accountId: fullTx.account_id,
      categoryId: fullTx.category_id,
      toAccountId: fullTx.to_account_id,
      createdAt: fullTx.created_at,
      updatedAt: fullTx.updated_at,
    };

    return NextResponse.json({ data: mapped }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/transactions error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
