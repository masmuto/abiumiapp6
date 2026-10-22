// Hook: subscribe ke Supabase Realtime untuk transaksi baru
// Saat Abi catat transaksi, Umi yang buka app di perangkat lain akan dapat notif
'use client';
import { useEffect, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { canShowNotification, showNotification } from "@/lib/notifications";
import { useSession } from "@/lib/session-store";
import { formatRupiah } from "@/lib/format";
import { TRANSACTION_TYPES } from "@/lib/constants";
import { toast } from "sonner";

export function useTransactionNotifications() {
  const { user } = useSession();
  // Ref untuk lookup tabel users & categories (cache)
  const usersMap = useRef<Map<string, any>>(new Map());
  const categoriesMap = useRef<Map<string, any>>(new Map());
  // Ref untuk track transaksi yang sudah di-notif (hindari duplikat)
  const notifiedTxIds = useRef<Set<string>>(new Set());

  // === Load lookup tables: users & categories ===
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Fetch users (untuk nama pencatat)
    supabase
      .from("users")
      .select("id, name, color")
      .then(({ data }) => {
        if (data) {
          usersMap.current = new Map(data.map((u: any) => [u.id, u]));
        }
      });

    // Fetch categories (untuk nama kategori & icon)
    supabase
      .from("categories")
      .select("id, name, type, icon, color")
      .then(({ data }) => {
        if (data) {
          categoriesMap.current = new Map(data.map((c: any) => [c.id, c]));
        }
      });
  }, []);

  // === Subscribe ke Realtime: tabel transactions ===
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel("notifications-transactions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
        },
        async (payload) => {
          const tx = payload.new as any;
          if (!tx || !tx.id) return;

          // Skip kalau sudah di-notif
          if (notifiedTxIds.current.has(tx.id)) return;
          notifiedTxIds.current.add(tx.id);

          // Skip kalau ini transaksi yang dicatat oleh user sendiri di device ini
          // (toast lokal sudah cukup, tidak perlu browser notif)
          if (user && tx.user_id === user.id) return;

          // Skip kalau notif tidak enabled atau tidak diizinkan
          if (!canShowNotification()) {
            // Tetap tampilkan toast sebagai fallback
            showTxToast(tx);
            return;
          }

          // Lookup user (pencatat)
          let txUser = usersMap.current.get(tx.user_id);
          if (!txUser) {
            // Refresh cache users
            const { data } = await supabase
              .from("users")
              .select("id, name, color")
              .eq("id", tx.user_id)
              .maybeSingle();
            if (data) {
              usersMap.current.set(data.id, data);
              txUser = data;
            }
          }

          // Lookup category
          let txCategory = tx.category_id
            ? categoriesMap.current.get(tx.category_id)
            : null;
          if (!txCategory && tx.category_id) {
            const { data } = await supabase
              .from("categories")
              .select("id, name, type, icon, color")
              .eq("id", tx.category_id)
              .maybeSingle();
            if (data) {
              categoriesMap.current.set(data.id, data);
              txCategory = data;
            }
          }

          // Lookup account
          let txAccount: any = null;
          if (tx.account_id) {
            const { data } = await supabase
              .from("accounts")
              .select("id, name, icon")
              .eq("id", tx.account_id)
              .maybeSingle();
            txAccount = data;
          }

          // === Build notification message ===
          const txType = TRANSACTION_TYPES[tx.type as keyof typeof TRANSACTION_TYPES];
          const amountStr = formatRupiah(tx.amount, false);
          const userName = txUser?.name ?? "Seseorang";
          const categoryLabel = txCategory?.icon
            ? `${txCategory.icon} ${txCategory.name}`
            : txCategory?.name ?? "Tanpa kategori";
          const accountName = txAccount?.name ?? "";

          const title =
            tx.type === "TRANSFER"
              ? `💸 ${userName} transfer ${amountStr}`
              : tx.type === "INCOME"
              ? `↘ ${userName} catat pemasukan ${amountStr}`
              : `↗ ${userName} catat pengeluaran ${amountStr}`;

          const body =
            tx.type === "TRANSFER"
              ? `${accountName}${tx.to_account_id ? " → " + (await getAccountName(tx.to_account_id)) : ""}${tx.note ? " • " + tx.note : ""}`
              : `${categoryLabel}${accountName ? " • " + accountName : ""}${tx.note ? " • " + tx.note : ""}`;

          // Show browser notification
          showNotification(title, {
            body,
            tag: `tx-${tx.id}`,
            data: { url: "/" },
            fallbackToast: true,
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[Notif] Subscribed to transactions");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[Notif] Channel error:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Helper: get account name by ID (cached)
  async function getAccountName(accountId: string): Promise<string> {
    const { data } = await supabase
      .from("accounts")
      .select("name")
      .eq("id", accountId)
      .maybeSingle();
    return data?.name ?? "";
  }

  // Fallback toast (kalau notif browser tidak enabled)
  function showTxToast(tx: any) {
    if (user && tx.user_id === user.id) return; // skip own tx
    const userName =
      usersMap.current.get(tx.user_id)?.name ?? "Seseorang";
    const typeLabel = TRANSACTION_TYPES[tx.type as keyof typeof TRANSACTION_TYPES]?.label ?? "Transaksi";
    toast(`${userName} catat ${typeLabel.toLowerCase()} ${formatRupiah(tx.amount, false)}`, {
      description: tx.note || undefined,
      duration: 5000,
    });
  }
}
