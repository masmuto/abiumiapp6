// Kartu ringkasan: pemasukan, pengeluaran, surplus, saldo, aset, kewajiban, net worth
'use client';
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah, formatRupiahShort } from "@/lib/format";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Layers,
  Scale,
  ArrowLeftRight,
} from "lucide-react";

export function SummaryCards({ report }: { report: any }) {
  if (!report) return null;
  const { summary, totalBalance, totalAssets, totalLiabilities, netWorth } =
    report;

  const cards = [
    {
      label: "Pemasukan",
      value: summary.income,
      sub: `${summary.incomeCount} transaksi`,
      icon: TrendingUp,
      tone: "emerald" as const,
    },
    {
      label: "Pengeluaran",
      value: summary.expense,
      sub: `${summary.expenseCount} transaksi`,
      icon: TrendingDown,
      tone: "rose" as const,
    },
    {
      label: "Surplus Bulan Ini",
      value: summary.surplus,
      sub: summary.surplus >= 0 ? "Lebih hemat" : "Defisit",
      icon: Scale,
      tone: summary.surplus >= 0 ? ("emerald" as const) : ("rose" as const),
    },
    {
      label: "Transfer",
      value: summary.transfer,
      sub: `${summary.transferCount} kali`,
      icon: ArrowLeftRight,
      tone: "amber" as const,
    },
  ];

  const toneClasses: Record<
    string,
    { bg: string; text: string; icon: string }
  > = {
    emerald: {
      bg: "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/10",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: "bg-emerald-600 text-white",
    },
    rose: {
      bg: "from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/10",
      text: "text-rose-700 dark:text-rose-300",
      icon: "bg-rose-600 text-white",
    },
    amber: {
      bg: "from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/10",
      text: "text-amber-700 dark:text-amber-300",
      icon: "bg-amber-600 text-white",
    },
    slate: {
      bg: "from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-800/10",
      text: "text-slate-700 dark:text-slate-300",
      icon: "bg-slate-600 text-white",
    },
  };

  return (
    <div className="space-y-4">
      {/* Grid summary bulan ini */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const t = toneClasses[c.tone];
          return (
            <Card
              key={c.label}
              className={`bg-gradient-to-br ${t.bg} border-0 shadow-sm overflow-hidden`}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-lg ${t.icon} flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {c.label}
                  </span>
                </div>
                <div className={`text-xl font-bold ${t.text} tracking-tight`}>
                  {formatRupiahShort(c.value)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {c.sub}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Net worth besar */}
      <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 shadow-lg shadow-emerald-600/20 overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 opacity-80" />
              <span className="text-sm font-medium opacity-90">
                Kekayaan Bersih
              </span>
            </div>
            <span className="text-xs opacity-70">estimasi</span>
          </div>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight">
            {formatRupiah(netWorth)}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="opacity-70">Saldo Rekening</div>
              <div className="font-semibold mt-0.5">
                {formatRupiahShort(totalBalance)}
              </div>
            </div>
            <div>
              <div className="opacity-70">Total Aset</div>
              <div className="font-semibold mt-0.5">
                {formatRupiahShort(totalAssets)}
              </div>
            </div>
            <div>
              <div className="opacity-70">Total Utang</div>
              <div className="font-semibold mt-0.5">
                {formatRupiahShort(totalLiabilities)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
