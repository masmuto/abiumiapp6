// API: /api/users
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, role, color, pin, created_at")
      .order("name", { ascending: true });
    if (error) {
      return NextResponse.json({ error: error.message, hint: "Jalankan SQL migration" }, { status: 500 });
    }
    const mapped = (data ?? []).map((u: any) => ({
      ...u,
      createdAt: u.created_at,
    }));
    return NextResponse.json({ data: mapped });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
