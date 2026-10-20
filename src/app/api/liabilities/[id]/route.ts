// API: /api/liabilities/[id]
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, amount, dueDate, note, settled } = body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (amount !== undefined) update.amount = Math.round(amount);
    if (note !== undefined) update.note = note;
    if (settled !== undefined) update.settled = settled;
    if (dueDate !== undefined) {
      update.due_date = dueDate ? new Date(dueDate + "T00:00:00").toISOString() : null;
    }
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("liabilities")
      .update(update)
      .eq("id", id)
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
    const { error } = await supabase.from("liabilities").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
