// API: /api/liabilities
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("liabilities")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message, hint: "Jalankan SQL migration" }, { status: 500 });
    }
    const mapped = (data ?? []).map((l: any) => ({
      ...l,
      dueDate: l.due_date,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }));
    return NextResponse.json({ data: mapped });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, amount, dueDate, note } = body;
    if (!name || !amount) {
      return NextResponse.json({ error: "Nama & nominal wajib" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("liabilities")
      .insert({
        name,
        amount: Math.round(amount),
        due_date: dueDate ? new Date(dueDate + "T00:00:00").toISOString() : null,
        note: note ?? null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      data: {
        ...data,
        dueDate: data.due_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
