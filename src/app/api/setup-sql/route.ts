// API: /api/setup-sql
// Sajikan file SQL migration sebagai text/plain untuk di-copy ke clipboard
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const sqlPath = join(process.cwd(), "scripts", "supabase-schema.sql");
    const sql = readFileSync(sqlPath, "utf-8");
    return new NextResponse(sql, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
