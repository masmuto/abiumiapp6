// Hooks Real-time Supabase: subscribe perubahan tabel
// Saat Abi catat transaksi dari HP-nya, Umi yang buka app di HP lain akan
// langsung melihat data baru tanpa refresh — powered by Supabase Realtime.
'use client';
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Subscribe ke perubahan tabel Supabase + invalidate TanStack Query cache
 * agar UI otomatis refresh dengan data terbaru.
 *
 * @param table - nama tabel di Supabase (transactions, accounts, dll)
 * @param queryKeys - array query keys yang harus di-invalidate saat ada perubahan
 */
export function useRealtimeSync(
  table: string,
  queryKeys: unknown[][]
) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        (payload) => {
          console.log(`[Realtime] ${table} changed:`, payload.eventType);
          // Invalidate semua query keys yang relevan
          for (const key of queryKeys) {
            qc.invalidateQueries({ queryKey: key });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Realtime] Subscribed to ${table}`);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(`[Realtime] ${table} channel error:`, status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);
}

/**
 * Subscribe SEMUA tabel penting sekaligus.
 * Pakai ini di root layout / provider untuk live sync global.
 */
export function useGlobalRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const tablesToWatch = [
      { table: "transactions", keys: [["transactions"], ["reports"], ["accounts"], ["budgets"]] },
      { table: "accounts", keys: [["accounts"], ["reports"]] },
      { table: "categories", keys: [["categories"]] },
      { table: "budgets", keys: [["budgets"], ["reports"]] },
      { table: "assets", keys: [["assets"], ["reports"]] },
      { table: "liabilities", keys: [["liabilities"], ["reports"]] },
      { table: "users", keys: [["users"]] },
    ];

    const channels = tablesToWatch.map(({ table, keys }) => {
      return supabase
        .channel(`realtime-global-${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            console.log(`[Realtime] Global sync: ${table} changed`);
            for (const key of keys) {
              qc.invalidateQueries({ queryKey: key });
            }
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, []);
}
