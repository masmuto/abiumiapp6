// API: /api/categories
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    let query = supabase.from("categories").select("*");
    if (type) query = query.eq("type", type);
    const { data, error } = await query.order("type", { ascending: true }).order("name", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message, hint: "Jalankan SQL migration" }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, icon, color } = body;
    if (!name || !type) {
      return NextResponse.json({ error: "Nama & jenis wajib" }, { status: 400 });
    }

    // Cek duplikat
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("name", name)
      .eq("type", type)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Kategori sudah ada" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name,
        type,
        icon: icon ?? null,
        color: color ?? "emerald",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
