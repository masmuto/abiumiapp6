// API: /api/accounts/[id]
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, type, icon, archived, adjustBalance } = body;

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (type !== undefined) update.type = type;
    if (icon !== undefined) update.icon = icon;
    if (archived !== undefined) update.archived = archived;
    if (typeof adjustBalance === "number") update.balance = Math.round(adjustBalance);
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("accounts")
      .update(update)
      .eq("id", id)
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

    return NextResponse.json({ data: mapped });
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

    // Cek transaksi terkait
    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .or(`account_id.eq.${id},to_account_id.eq.${id}`);

    if ((count ?? 0) > 0) {
      // Soft archive
      const { data, error } = await supabase
        .from("accounts")
        .update({ archived: true, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({
        data: { ...data, initialBalance: data.initial_balance },
        warning: `Rekening punya ${count} transaksi, diarsipkan saja (tidak dihapus)`,
      });
    }

    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
