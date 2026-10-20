// Utilitas format mata uang Rupiah & tanggal (Bahasa Indonesia)

/**
 * Format angka ke Rupiah, mis. 150000 -> "Rp 150.000"
 * @param amount dalam Rupiah (integer)
 * @param withSymbol apakah menyertakan "Rp"
 */
export function formatRupiah(amount: number, withSymbol = true): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("id-ID");
  return `${sign}${withSymbol ? "Rp " : ""}${formatted}`;
}

/**
 * Format compact: 1.5 jt, 250 rb, 1 M
 */
export function formatRupiahShort(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)} rb`;
  return `${sign}${abs}`;
}

/**
 * Parse string input ke number Rupiah
 * "Rp 150.000" -> 150000, "1.5 jt" -> 1500000
 */
export function parseRupiah(input: string): number {
  if (typeof input === "number") return input;
  if (!input) return 0;
  const cleaned = input
    .replace(/rp/i, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  return Math.round(parseFloat(cleaned) || 0);
}

/**
 * Format tanggal Indonesia: "Senin, 16 Oktober 2026"
 */
export function formatTanggalLengkap(date: Date): string {
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][date.getDay()];
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][date.getMonth()];
  return `${hari}, ${date.getDate()} ${bulan} ${date.getFullYear()}`;
}

/**
 * Format tanggal pendek: "16 Okt 2026"
 */
export function formatTanggalPendek(date: Date): string {
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][date.getMonth()];
  return `${date.getDate()} ${bulan} ${date.getFullYear()}`;
}

/**
 * Format tanggal ISO ke yyyy-mm-dd untuk input[type=date]
 */
export function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Warna Tailwind untuk chip/label
 */
export const COLOR_CLASSES: Record<string, { bg: string; text: string; ring: string }> = {
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  teal: { bg: "bg-teal-100 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", ring: "ring-teal-200 dark:ring-teal-800" },
  amber: { bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800" },
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-300", ring: "ring-yellow-200 dark:ring-yellow-800" },
  rose: { bg: "bg-rose-100 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800" },
  lime: { bg: "bg-lime-100 dark:bg-lime-950/40", text: "text-lime-700 dark:text-lime-300", ring: "ring-lime-200 dark:ring-lime-800" },
  slate: { bg: "bg-slate-100 dark:bg-slate-950/40", text: "text-slate-700 dark:text-slate-300", ring: "ring-slate-200 dark:ring-slate-800" },
  sky: { bg: "bg-sky-100 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-200 dark:ring-sky-800" },
};

export function colorClass(color: string) {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.emerald;
}
