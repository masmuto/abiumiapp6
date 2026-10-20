// API: /api/transactions/[id]
// Hapus transaksi via RPC delete_transaction (reverse saldo atomic)
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Panggil RPC untuk hapus + reverse saldo dalam satu transaksi
    const { error } = await supabase.rpc("delete_transaction", {
      p_tx_id: id,
    });

    if (error) {
      return NextResponse.json(
        { error: "Supabase error: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/transactions/[id] error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
