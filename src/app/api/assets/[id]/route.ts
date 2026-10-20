// API: /api/assets/[id]
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, type, quantity, unitPrice, note } = body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (type !== undefined) update.type = type;
    if (typeof quantity === "number") update.quantity = quantity;
    if (typeof unitPrice === "number") update.unit_price = Math.round(unitPrice);
    if (note !== undefined) update.note = note;
    update.updated_at = new Date().toISOString();

    // Fetch current untuk recalc value
    const { data: current } = await supabase
      .from("assets")
      .select("quantity, unit_price")
      .eq("id", id)
      .single();
    if (current) {
      const q = update.quantity ?? current.quantity;
      const up = update.unit_price ?? current.unit_price;
      update.value = Math.round(q * up);
    }

    const { data, error } = await supabase
      .from("assets")
      .update(update)
      .eq("id", id)
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
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
