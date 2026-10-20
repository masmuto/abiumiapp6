// Konstanta aplikasi: kategori, jenis rekening, warna, dll.
// Bahasa Indonesia, untuk keluarga (Abi & Umi)

// ===== JENIS REKENING =====
export type AccountType =
  | "CASH"
  | "BANK"
  | "EWALLET"
  | "SAVINGS"
  | "GOLD"
  | "OTHER";

export const ACCOUNT_TYPES: Record<
  AccountType,
  { label: string; icon: string; color: string }
> = {
  CASH: { label: "Tunai", icon: "💵", color: "emerald" },
  BANK: { label: "Bank", icon: "🏦", color: "teal" },
  EWALLET: { label: "E-Wallet", icon: "📱", color: "amber" },
  SAVINGS: { label: "Tabungan", icon: "🐷", color: "lime" },
  GOLD: { label: "Emas/Dinar", icon: "🪙", color: "yellow" },
  OTHER: { label: "Lainnya", icon: "💼", color: "slate" },
};

// ===== JENIS TRANSAKSI =====
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export const TRANSACTION_TYPES: Record<
  TransactionType,
  { label: string; icon: string; color: string }
> = {
  INCOME: { label: "Pemasukan", icon: "↘", color: "emerald" },
  EXPENSE: { label: "Pengeluaran", icon: "↗", color: "rose" },
  TRANSFER: { label: "Transfer", icon: "⇄", color: "amber" },
};

// ===== KATEGORI DEFAULT =====
// Kategori pemasukan & pengeluaran umum untuk keluarga Indonesia
export const DEFAULT_CATEGORIES: {
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}[] = [
  // Pemasukan
  { name: "Gaji", type: "INCOME", icon: "💰", color: "emerald" },
  { name: "Bonus", type: "INCOME", icon: "🎁", color: "emerald" },
  { name: " THR", type: "INCOME", icon: "🕌", color: "emerald" },
  { name: "Hasil Jualan", type: "INCOME", icon: "🛒", color: "emerald" },
  { name: "Hadiah", type: "INCOME", icon: "🎀", color: "emerald" },
  { name: "Bantuan", type: "INCOME", icon: "🤝", color: "emerald" },
  { name: "Bagi Hasil", type: "INCOME", icon: "📊", color: "emerald" },
  { name: "Lain-lain (Masuk)", type: "INCOME", icon: "📥", color: "emerald" },

  // Pengeluaran - kebutuhan pokok
  { name: "SPP Anak", type: "EXPENSE", icon: "🎓", color: "rose" },
  { name: "Uang Saku", type: "EXPENSE", icon: "👛", color: "rose" },
  { name: "Makan", type: "EXPENSE", icon: "🍱", color: "rose" },
  { name: "Belanja Bulanan", type: "EXPENSE", icon: "🛍️", color: "rose" },
  { name: "Listrik", type: "EXPENSE", icon: "💡", color: "rose" },
  { name: "Air", type: "EXPENSE", icon: "🚰", color: "rose" },
  { name: "Kontrak Rumah", type: "EXPENSE", icon: "🏠", color: "rose" },
  { name: "Telepon & Internet", type: "EXPENSE", icon: "📶", color: "rose" },
  { name: "BBM", type: "EXPENSE", icon: "⛽", color: "rose" },
  { name: "Transportasi", type: "EXPENSE", icon: "🚗", color: "rose" },

  // Pengeluaran - kesehatan & pendidikan
  { name: "Kesehatan", type: "EXPENSE", icon: "🏥", color: "rose" },
  { name: "Obat", type: "EXPENSE", icon: "💊", color: "rose" },
  { name: "Buku & ATK", type: "EXPENSE", icon: "📚", color: "rose" },
  { name: "Les Anak", type: "EXPENSE", icon: "✏️", color: "rose" },

  // Pengeluaran - sosial & ibadah
  { name: "Sedekah", type: "EXPENSE", icon: "🤲", color: "rose" },
  { name: "Infak", type: "EXPENSE", icon: "🕌", color: "rose" },
  { name: "Zakat", type: "EXPENSE", icon: "🌟", color: "rose" },
  { name: "Hadiah Keluar", type: "EXPENSE", icon: "🎁", color: "rose" },

  // Pengeluaran - tabungan & investasi
  { name: "Tabungan", type: "EXPENSE", icon: "🐷", color: "amber" },
  { name: "Belanja Emas", type: "EXPENSE", icon: "🪙", color: "amber" },
  { name: "Investasi", type: "EXPENSE", icon: "📈", color: "amber" },

  // Pengeluaran - hiburan
  { name: "Jalan-jalan", type: "EXPENSE", icon: "🏞️", color: "rose" },
  { name: "Hiburan", type: "EXPENSE", icon: "🎮", color: "rose" },

  { name: "Lain-lain (Keluar)", type: "EXPENSE", icon: "📤", color: "rose" },
];

// ===== JENIS ASET =====
export type AssetType = "GOLD" | "DINAR" | "CASH" | "INVESTMENT" | "OTHER";

export const ASSET_TYPES: Record<
  AssetType,
  { label: string; icon: string }
> = {
  GOLD: { label: "Emas", icon: "🪙" },
  DINAR: { label: "Dinar", icon: "🟡" },
  CASH: { label: "Tunai/Setara", icon: "💵" },
  INVESTMENT: { label: "Investasi", icon: "📈" },
  OTHER: { label: "Lainnya", icon: "💼" },
};

// ===== DAFTAR BULAN =====
export const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const MONTHS_SHORT_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// ===== DEFAULT USERS (Abi & Umi) =====
export const DEFAULT_USERS = [
  { name: "Abi", role: "PARENT", color: "emerald", pin: null },
  { name: "Umi", role: "PARENT", color: "rose", pin: null },
];
