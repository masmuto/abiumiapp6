// Supabase client — koneksi ke PostgreSQL cloud + realtime
// Dipakai di API routes (server) dan komponen client (browser)
import { createClient } from "@supabase/supabase-js";

// === Supabase credentials ===
// Prioritas: env vars (Vercel/production), fallback ke hardcoded (sandbox).
// NEXT_PUBLIC_ vars aman di-hardcode (publishable key, bukan service role).
const FALLBACK_SUPABASE_URL = "https://mtgmwgawjcscgammixnu.supabase.co";
const FALLBACK_SUPABASE_KEY =
  "sb_publishable_fSKXWTnILil05GBtKH_WkA_sx7fvOzm";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[Supabase] Environment variable NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diset. " +
      "Menggunakan fallback hardcoded."
  );
}

// Server client — tidak ada persistence option (tidak perlu di API route)
export const supabase = createClient(
  supabaseUrl ?? "https://example.supabase.co",
  supabaseKey ?? "dummy-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 5,
      },
    },
  }
);

// Check koneksi (untuk debugging)
export async function checkSupabaseConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!supabaseUrl || !supabaseKey) {
    return { ok: false, error: "Environment variable belum diset" };
  }
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true })
      .limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// Helper: apakah Supabase aktif?
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
