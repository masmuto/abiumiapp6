// Utilitas ekspor Excel (xlsx) dan PDF (jspdf)
// Sisi klien - tidak memanggil API backend untuk generate file
'use client';
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  formatRupiah,
  formatTanggalPendek,
  formatTanggalLengkap,
} from "@/lib/format";
import { TRANSACTION_TYPES, MONTHS_ID } from "@/lib/constants";

type ReportData = {
  period: { month: number; year: number };
  summary: any;
  accounts: any[];
  totalBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown: any[];
  assets: any[];
  liabilities: any[];
};

export async function exportExcel(
  report: ReportData,
  transactions: any[]
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan
  const ringkasan = [
    ["LAPORAN KEUANGAN KELUARGA"],
    ["Periode", `${MONTHS_ID[report.period.month - 1]} ${report.period.year}`],
    ["Dibuat", formatTanggalLengkap(new Date())],
    [],
    ["Rincian", "Nilai (Rp)"],
    ["Total Pemasukan", report.summary.income],
    ["Total Pengeluaran", report.summary.expense],
    ["Total Transfer", report.summary.transfer],
    ["Surplus/Defisit", report.summary.surplus],
    [],
    ["Saldo Rekening", report.totalBalance],
    ["Total Aset", report.totalAssets],
    ["Total Kewajiban", report.totalLiabilities],
    ["KEKAYAAN BERSIH", report.netWorth],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(ringkasan);
  ws1["!cols"] = [{ wch: 24 }, { wch: 20 }];
  ws1["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  // Style header (bold) - di xlsx community edition tidak ada styling,
  // tapi kita bisa pakai format teks
  XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan");

  // Sheet 2: Transaksi
  const txRows = (transactions ?? []).map((t: any) => [
    formatTanggalPendek(new Date(t.date)),
    TRANSACTION_TYPES[t.type as keyof typeof TRANSACTION_TYPES]?.label ?? t.type,
    t.category?.name ?? "-",
    t.account?.name ?? "-",
    t.toAccount?.name ?? "",
    t.amount,
    t.note ?? "",
    t.user?.name ?? "",
  ]);
  const txData = [
    ["Tanggal", "Jenis", "Kategori", "Rekening", "Rekening Tujuan", "Nominal", "Catatan", "Dicatat Oleh"],
    ...txRows,
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(txData);
  ws2["!cols"] = [
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 24 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Transaksi");

  // Sheet 3: Per Kategori
  const catRows = (report.breakdown ?? []).map((b) => [b.name, b.total]);
  const catData = [
    ["Kategori", "Total (Rp)"],
    ...catRows,
    ["TOTAL", report.summary.expense],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(catData);
  ws3["!cols"] = [{ wch: 24 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Per Kategori");

  // Sheet 4: Saldo Rekening
  const accRows = (report.accounts ?? []).map((a) => [
    a.name,
    a.type,
    a.balance,
    a.income,
    a.expense,
  ]);
  const accData = [
    ["Rekening", "Jenis", "Saldo", "Pemasukan", "Pengeluaran"],
    ...accRows,
    ["TOTAL", "", report.totalBalance, "", ""],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(accData);
  ws4["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws4, "Rekening");

  // Sheet 5: Aset
  const asRows = (report.assets ?? []).map((a) => [
    a.name,
    a.type,
    a.quantity,
    a.unitPrice,
    a.value,
  ]);
  const asData = [
    ["Aset", "Jenis", "Jumlah", "Harga/Unit", "Nilai Total"],
    ...asRows,
    ["TOTAL", "", "", "", report.totalAssets],
  ];
  const ws5 = XLSX.utils.aoa_to_sheet(asData);
  ws5["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws5, "Aset");

  // Sheet 6: Kewajiban
  const liRows = (report.liabilities ?? []).map((l) => [
    l.name,
    l.amount,
    l.dueDate ? formatTanggalPendek(new Date(l.dueDate)) : "-",
    l.settled ? "Lunas" : "Belum",
    l.note ?? "",
  ]);
  const liData = [
    ["Kewajiban", "Nominal", "Jatuh Tempo", "Status", "Catatan"],
    ...liRows,
    ["TOTAL", report.totalLiabilities, "", "", ""],
  ];
  const ws6 = XLSX.utils.aoa_to_sheet(liData);
  ws6["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, ws6, "Kewajiban");

  const filename = `laporan-keuangan-${report.period.year}-${String(
    report.period.month
  ).padStart(2, "0")}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export async function exportPDF(
  report: ReportData,
  transactions: any[]
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LAPORAN KEUANGAN KELUARGA", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Periode: ${MONTHS_ID[report.period.month - 1]} ${report.period.year}`,
    margin,
    y
  );
  y += 5;
  doc.text(`Dibuat: ${formatTanggalLengkap(new Date())}`, margin, y);
  y += 6;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // Ringkasan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Ringkasan Bulan Ini", margin, y);
  y += 3;
  autoTable(doc, {
    startY: y,
    head: [["Item", "Nilai"]],
    body: [
      ["Total Pemasukan", formatRupiah(report.summary.income)],
      ["Total Pengeluaran", formatRupiah(report.summary.expense)],
      ["Total Transfer", formatRupiah(report.summary.transfer)],
      ["Surplus / (Defisit)", formatRupiah(report.summary.surplus)],
    ],
    theme: "striped",
    headStyles: { fillColor: [16, 185, 129], halign: "left" },
    bodyStyles: { halign: "left" },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Kekayaan Bersih
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Kekayaan Bersih", margin, y);
  y += 3;
  autoTable(doc, {
    startY: y,
    head: [["Komponen", "Nilai"]],
    body: [
      ["Saldo Semua Rekening", formatRupiah(report.totalBalance)],
      ["Total Aset (Emas, Dinar, dll)", formatRupiah(report.totalAssets)],
      ["Total Kewajiban (Utang)", formatRupiah(report.totalLiabilities)],
      ["KEKAYAAN BERSIH", formatRupiah(report.netWorth)],
    ],
    theme: "grid",
    headStyles: { fillColor: [180, 83, 9], halign: "left" },
    bodyStyles: { halign: "left" },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Per Kategori
  if (report.breakdown && report.breakdown.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 16;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Pengeluaran per Kategori", margin, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [["Kategori", "Total"]],
      body: report.breakdown.map((b) => [b.name, formatRupiah(b.total)]),
      foot: [["TOTAL", formatRupiah(report.summary.expense)]],
      theme: "striped",
      headStyles: { fillColor: [244, 63, 94], halign: "left" },
      columnStyles: { 1: { halign: "right" } },
      footStyles: { fillColor: [240, 240, 240], textColor: 0 },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Saldo per Rekening
  if (report.accounts && report.accounts.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 16;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Saldo per Rekening", margin, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [["Rekening", "Saldo", "Masuk", "Keluar"]],
      body: report.accounts.map((a) => [
        a.name,
        formatRupiah(a.balance),
        formatRupiah(a.income),
        formatRupiah(a.expense),
      ]),
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129], halign: "left" },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Daftar Transaksi
  if (transactions && transactions.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 16;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Daftar Transaksi", margin, y);
    y += 3;
    autoTable(doc, {
      startY: y,
      head: [["Tgl", "Jenis", "Kategori", "Rekening", "Nominal"]],
      body: transactions.slice(0, 50).map((t: any) => [
        formatTanggalPendek(new Date(t.date)),
        TRANSACTION_TYPES[t.type as keyof typeof TRANSACTION_TYPES]?.label ?? t.type,
        t.category?.name ?? "-",
        t.account?.name ?? "-",
        (t.type === "INCOME" ? "+ " : t.type === "EXPENSE" ? "− " : "") +
          formatRupiah(t.amount, false),
      ]),
      theme: "striped",
      headStyles: { fillColor: [55, 65, 81], halign: "left" },
      columnStyles: { 4: { halign: "right" } },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        // footer page number
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.text(
          `Halaman ${doc.getNumberOfPages()}`,
          pageW - margin,
          pageH - 8,
          { align: "right" }
        );
      },
    });
  }

  // Footer di halaman terakhir
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Generated oleh Aplikasi Keuangan Keluarga — ${formatTanggalLengkap(new Date())}`,
    margin,
    pageH - 8
  );

  const filename = `laporan-keuangan-${report.period.year}-${String(
    report.period.month
  ).padStart(2, "0")}.pdf`;
  doc.save(filename);
}
