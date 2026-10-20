// API: /api/assets
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message, hint: "Jalankan SQL migration" }, { status: 500 });
    }
    // Map
    const mapped = (data ?? []).map((a: any) => ({
      ...a,
      unitPrice: a.unit_price,
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
    const { name, type, quantity, unitPrice, note } = body;
    if (!name || !type) {
      return NextResponse.json({ error: "Nama & jenis wajib" }, { status: 400 });
    }
    const q = parseFloat(quantity ?? 1);
    const up = Math.max(0, Math.round(unitPrice ?? 0));

    const { data, error } = await supabase
      .from("assets")
      .insert({
        name,
        type,
        quantity: q,
        unit_price: up,
        value: Math.round(q * up),
        note: note ?? null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      data: {
        ...data,
        unitPrice: data.unit_price,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
