// Hooks TanStack Query untuk semua entitas
'use client';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ===== Generic fetcher =====
// Handle offline: bila fetch gagal (network error) atau 503, kembalikan
// pesan yang user-friendly. TanStack Query akan tetap menampilkan data
// cache lama (jika ada) berkat defaultOptions.keepPreviousData.
async function fetchJSON(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: "Gagal memuat data" }));
      // 503 = offline response dari SW
      if (res.status === 503 && e.offline) {
        throw new Error("Anda sedang offline. Menampilkan data terakhir.");
      }
      throw new Error(e.error || "Gagal memuat data");
    }
    return res.json();
  } catch (err: any) {
    // Network error (offline, SW gagal ambil dari cache)
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Koneksi internet bermasalah. Cek jaringan Anda.");
    }
    throw err;
  }
}

async function postJSON(url: string, body: any, method = "POST") {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: "Gagal menyimpan" }));
      if (res.status === 503 && e.offline) {
        throw new Error("Tidak bisa menyimpan saat offline. Sambungkan internet Anda.");
      }
      throw new Error(e.error || "Gagal menyimpan");
    }
    return res.json();
  } catch (err: any) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error("Tidak bisa terhubung ke server. Periksa koneksi internet.");
    }
    throw err;
  }
}

// ===== Transactions =====
export function useTransactions(filters: {
  month?: number;
  year?: number;
  type?: string;
  accountId?: string;
  limit?: number;
} = {}) {
  const params = new URLSearchParams();
  if (filters.month) params.set("month", String(filters.month));
  if (filters.year) params.set("year", String(filters.year));
  if (filters.type) params.set("type", filters.type);
  if (filters.accountId) params.set("accountId", filters.accountId);
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchJSON(`/api/transactions${qs ? "?" + qs : ""}`),
    select: (r) => r.data,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => postJSON("/api/transactions", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Transaksi tersimpan, saldo diperbarui");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      postJSON(`/api/transactions/${id}`, {}, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Transaksi dihapus, saldo dikembalikan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== Accounts =====
export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => fetchJSON("/api/accounts"),
    select: (r) => r.data,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => postJSON("/api/accounts", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Rekening ditambahkan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) =>
      postJSON(`/api/accounts/${id}`, body, "PATCH"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Rekening diperbarui");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postJSON(`/api/accounts/${id}`, {}, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Rekening dihapus/diarsipkan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== Categories =====
export function useCategories(type?: string) {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () =>
      fetchJSON(`/api/categories${type ? "?type=" + type : ""}`),
    select: (r) => r.data,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => postJSON("/api/categories", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Kategori ditambahkan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postJSON(`/api/categories/${id}`, {}, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Kategori dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) =>
      postJSON(`/api/categories/${id}`, body, "PATCH"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Kategori diperbarui");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== Budgets =====
export function useBudgets(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  const qs = params.toString();
  return useQuery({
    queryKey: ["budgets", month, year],
    queryFn: () => fetchJSON(`/api/budgets${qs ? "?" + qs : ""}`),
    select: (r) => r.data,
  });
}

export function useUpsertBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => postJSON("/api/budgets", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Anggaran disimpan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postJSON(`/api/budgets/${id}`, {}, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Anggaran dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== Assets =====
export function useAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: () => fetchJSON("/api/assets"),
    select: (r) => r.data,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => postJSON("/api/assets", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Aset ditambahkan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) =>
      postJSON(`/api/assets/${id}`, body, "PATCH"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Aset diperbarui");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postJSON(`/api/assets/${id}`, {}, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Aset dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== Liabilities =====
export function useLiabilities() {
  return useQuery({
    queryKey: ["liabilities"],
    queryFn: () => fetchJSON("/api/liabilities"),
    select: (r) => r.data,
  });
}

export function useCreateLiability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => postJSON("/api/liabilities", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liabilities"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Kewajiban ditambahkan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLiability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) =>
      postJSON(`/api/liabilities/${id}`, body, "PATCH"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liabilities"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Kewajiban diperbarui");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLiability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      postJSON(`/api/liabilities/${id}`, {}, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liabilities"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Kewajiban dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ===== Users =====
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => fetchJSON("/api/users"),
    select: (r) => r.data,
  });
}

// ===== Reports =====
export function useReport(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  const qs = params.toString();
  return useQuery({
    queryKey: ["reports", month, year],
    queryFn: () => fetchJSON(`/api/reports${qs ? "?" + qs : ""}`),
    select: (r) => r.data,
  });
}

// ===== Seed =====
export function useSeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => postJSON("/api/seed", {}),
    onSuccess: (r) => {
      qc.invalidateQueries();
      toast.success("Data awal dimuat!");
      console.log("Seed result:", r);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
