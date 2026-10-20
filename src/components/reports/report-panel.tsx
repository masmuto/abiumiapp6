// Panel laporan: ringkasan + tombol ekspor Excel & PDF
'use client';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatRupiahShort } from "@/lib/format";
import { MONTHS_ID } from "@/lib/constants";
import {
  FileSpreadsheet,
  FileText,
  Loader2,
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet,
  Layers,
  ArrowLeftRight,
} from "lucide-react";
import { exportExcel, exportPDF } from "@/lib/export-utils";
import { useReport, useTransactions } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function ReportPanel({
  month,
  year,
}: {
  month: number;
  year: number;
}) {
  const { data: report, isLoading } = useReport(month, year);
  const { data: transactions } = useTransactions({ month, year });
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);

  const handleExcel = async () => {
    if (!report) return;
    setExporting("xlsx");
    try {
      await exportExcel(report, transactions ?? []);
      toast.success("File Excel berhasil diunduh");
    } catch (e: any) {
      toast.error("Gagal ekspor Excel: " + e.message);
    } finally {
      setExporting(null);
    }
  };

  const handlePDF = async () => {
    if (!report) return;
    setExporting("pdf");
    try {
      await exportPDF(report, transactions ?? []);
      toast.success("File PDF berhasil diunduh");
    } catch (e: any) {
      toast.error("Gagal ekspor PDF: " + e.message);
    } finally {
      setExporting(null);
    }
  };

  if (isLoading || !report) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const { summary, totalBalance, totalAssets, totalLiabilities, netWorth, accounts } =
    report;

  const items = [
    {
      label: "Pemasukan",
      value: summary.income,
      icon: TrendingUp,
      color: "emerald",
    },
    {
      label: "Pengeluaran",
      value: summary.expense,
      icon: TrendingDown,
      color: "rose",
    },
    {
      label: "Surplus/(Defisit)",
      value: summary.surplus,
      icon: Scale,
      color: summary.surplus >= 0 ? "emerald" : "rose",
    },
    {
      label: "Transfer",
      value: summary.transfer,
      icon: ArrowLeftRight,
      color: "amber",
    },
    {
      label: "Saldo Rekening",
      value: totalBalance,
      icon: Wallet,
      color: "teal",
    },
    {
      label: "Total Aset",
      value: totalAssets,
      icon: Layers,
      color: "amber",
    },
    {
      label: "Total Kewajiban",
      value: -totalLiabilities,
      icon: Scale,
      color: "rose",
    },
    {
      label: "Kekayaan Bersih",
      value: netWorth,
      icon: Wallet,
      color: "emerald",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold">
            Laporan {MONTHS_ID[month - 1]} {year}
          </h2>
          <p className="text-sm text-muted-foreground">
            Ringkasan real-time keuangan keluarga.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExcel}
            variant="outline"
            size="sm"
            disabled={exporting !== null}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {exporting === "xlsx" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Excel
          </Button>
          <Button
            onClick={handlePDF}
            size="sm"
            disabled={exporting !== null}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {exporting === "pdf" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Grid metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Card
              key={it.label}
              className="bg-gradient-to-br from-emerald-50/50 to-amber-50/50 dark:from-emerald-950/20 dark:to-amber-950/20 border-emerald-100/50"
            >
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-muted-foreground">
                    {it.label}
                  </span>
                </div>
                <div
                  className={`text-lg font-bold tabular-nums ${
                    it.value < 0 ? "text-rose-600" : ""
                  }`}
                >
                  {formatRupiahShort(it.value)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail per rekening */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            Detail per Rekening — {MONTHS_ID[month - 1]} {year}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-2 pr-3 font-medium">Rekening</th>
                <th className="py-2 pr-3 font-medium text-right">Pemasukan</th>
                <th className="py-2 pr-3 font-medium text-right">Pengeluaran</th>
                <th className="py-2 pr-3 font-medium text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {accounts?.map((a: any) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    <span className="mr-1">{a.icon}</span>
                    {a.name}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-emerald-600">
                    {formatRupiah(a.income, false)}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-rose-600">
                    {formatRupiah(a.expense, false)}
                  </td>
                  <td className="py-2 pr-3 text-right font-bold tabular-nums">
                    {formatRupiah(a.balance)}
                  </td>
                </tr>
              ))}
              {accounts?.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-4 text-center text-muted-foreground"
                  >
                    Belum ada rekening.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className="py-2 pr-3">TOTAL</td>
                <td className="py-2 pr-3 text-right tabular-nums text-emerald-600">
                  {formatRupiah(summary.income, false)}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-rose-600">
                  {formatRupiah(summary.expense, false)}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {formatRupiah(totalBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Laporan ini diperbarui otomatis setiap ada transaksi baru. File Excel
        &amp; PDF diunduh ke perangkat ini.
      </p>
    </div>
  );
}
