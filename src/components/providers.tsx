// Provider TanStack Query untuk data fetching & sinkronisasi real-time
// Konfigurasi mendukung PWA offline: tetap pakai data cache bila offline
'use client';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Refresh cepat untuk sinkronisasi antar perangkat
            staleTime: 5_000,
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchInterval: 30_000, // refresh tiap 30s saat tab aktif
            retry: (failureCount, error: any) => {
              // Jangan retry untuk error offline - data cache tetap dipakai
              if (
                error?.message?.includes("offline") ||
                error?.message?.includes("Tidak bisa terhubung") ||
                error?.message?.includes("Koneksi internet")
              ) {
                return false;
              }
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
            // Pertahankan data cache saat refresh gagal (offline mode)
            keepPreviousData: true,
          },
          mutations: {
            retry: 0, // Mutasi jangan retry - ditangani user
          },
        },
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
