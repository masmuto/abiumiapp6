// API: /api/reports?month=&year=
// Ringkasan real-time: pemasukan, pengeluaran, surplus, saldo, aset, kewajiban, net worth
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const accountId = searchParams.get("accountId");

    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 1).toISOString();

    // 1. Fetch semua transaksi bulan ini (untuk aggregate income/expense/transfer & breakdown)
    let txQuery = supabase
      .from("transactions")
      .select("id, date, type, amount, category_id, account_id, to_account_id, note")
      .gte("date", start)
      .lt("date", end);
    if (accountId) {
      txQuery = txQuery.or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`);
    }
    const { data: txs, error: txError } = await txQuery;
    if (txError) {
      return NextResponse.json({ error: txError.message, hint: "Jalankan SQL migration" }, { status: 500 });
    }

    const transactions = txs ?? [];
    const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const transfer = transactions.filter((t) => t.type === "TRANSFER").reduce((s, t) => s + t.amount, 0);
    const incomeCount = transactions.filter((t) => t.type === "INCOME").length;
    const expenseCount = transactions.filter((t) => t.type === "EXPENSE").length;
    const transferCount = transactions.filter((t) => t.type === "TRANSFER").length;

    // 2. Accounts dengan income/expense per bulan
    const { data: accounts, error: accError } = await supabase
      .from("accounts")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: true });
    if (accError) {
      return NextResponse.json({ error: accError.message }, { status: 500 });
    }

    const accountList = accounts ?? [];
    const totalBalance = accountList.reduce((s, a) => s + a.balance, 0);

    // Income/expense per account bulan ini
    const accountsWithTx = accountList.map((a) => {
      const accIncome = transactions
        .filter((t) => t.type === "INCOME" && t.account_id === a.id)
        .reduce((s, t) => s + t.amount, 0);
      const accExpense = transactions
        .filter((t) => t.type === "EXPENSE" && t.account_id === a.id)
        .reduce((s, t) => s + t.amount, 0);
      return {
        ...a,
        initialBalance: a.initial_balance,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        income: accIncome,
        expense: accExpense,
      };
    });

    // 3. Aset
    const { data: assets } = await supabase.from("assets").select("*");
    const assetList = (assets ?? []).map((a: any) => ({
      ...a,
      unitPrice: a.unit_price,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));
    const totalAssets = assetList.reduce((s, a) => s + a.value, 0);

    // 4. Liabilities (yang belum lunas)
    const { data: liabilities } = await supabase
      .from("liabilities")
      .select("*")
      .eq("settled", false);
    const liabilityList = (liabilities ?? []).map((l: any) => ({
      ...l,
      dueDate: l.due_date,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }));
    const totalLiabilities = liabilityList.reduce((s, l) => s + l.amount, 0);

    const netWorth = totalBalance + totalAssets - totalLiabilities;

    // 5. Breakdown per kategori
    const categoryIds = [...new Set(transactions.filter((t) => t.category_id).map((t) => t.category_id))];
    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .in("id", categoryIds.length > 0 ? categoryIds : ["00000000-0000-0000-0000-000000000000"]);

    const catMap = new Map((categories ?? []).map((c: any) => [c.id, c]));
    const breakdownMap: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === "EXPENSE" && t.category_id) {
        breakdownMap[t.category_id] = (breakdownMap[t.category_id] ?? 0) + t.amount;
      }
    }
    const breakdown = Object.entries(breakdownMap)
      .map(([catId, total]) => {
        const cat = catMap.get(catId);
        return {
          categoryId: catId,
          name: cat?.name ?? "Tanpa kategori",
          icon: cat?.icon ?? "📦",
          color: cat?.color ?? "slate",
          total,
        };
      })
      .filter((b) => b.total > 0)
      .sort((a, b) => b.total - a.total);

    // 6. Daily breakdown
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyMap: Record<number, { income: number; expense: number }> = {};
    for (const t of transactions) {
      const d = new Date(t.date).getDate();
      if (!dailyMap[d]) dailyMap[d] = { income: 0, expense: 0 };
      if (t.type === "INCOME") dailyMap[d].income += t.amount;
      else if (t.type === "EXPENSE") dailyMap[d].expense += t.amount;
    }
    const daily = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      ...(dailyMap[i + 1] ?? { income: 0, expense: 0 }),
    }));

    return NextResponse.json({
      data: {
        period: { month, year },
        summary: {
          income,
          expense,
          transfer,
          incomeCount,
          expenseCount,
          transferCount,
          surplus: income - expense,
        },
        accounts: accountsWithTx,
        totalBalance,
        totalAssets,
        totalLiabilities,
        netWorth,
        breakdown,
        daily,
        assets: assetList,
        liabilities: liabilityList,
      },
    });
  } catch (e: any) {
    console.error("GET /api/reports error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
