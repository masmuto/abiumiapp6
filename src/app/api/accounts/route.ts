// API: /api/accounts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message, hint: "Jalankan SQL migration di Supabase Dashboard" },
        { status: 500 }
      );
    }

    // Map ke camelCase
    const mapped = (data ?? []).map((a: any) => ({
      ...a,
      initialBalance: a.initial_balance,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));

    return NextResponse.json({ data: mapped });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, initialBalance, icon } = body;
    if (!name || !type) {
      return NextResponse.json({ error: "Nama & jenis wajib" }, { status: 400 });
    }
    const initial = Math.max(0, Math.round(initialBalance || 0));

    const { data, error } = await supabase
      .from("accounts")
      .insert({
        name,
        type,
        icon: icon ?? null,
        initial_balance: initial,
        balance: initial,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = {
      ...data,
      initialBalance: data.initial_balance,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ data: mapped }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
