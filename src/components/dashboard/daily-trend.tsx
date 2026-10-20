// Grafik tren harian: pemasukan vs pengeluaran
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatRupiahShort } from "@/lib/format";
import { LineChart as LineIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DailyTrendChart({
  daily,
  isLoading,
}: {
  daily: any[];
  isLoading: boolean;
}) {
  const data = (daily ?? []).map((d) => ({
    ...d,
    label: `${d.day}`,
  }));
  const peak = data.reduce(
    (m, d) => Math.max(m, d.income, d.expense),
    0
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <LineIcon className="w-4 h-4 text-emerald-600" />
          Tren Harian Bulan Ini
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : peak > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={data}
              margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                interval={Math.max(0, Math.floor(data.length / 10) - 1)}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                tickFormatter={(v) => formatRupiahShort(v)}
                width={50}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-md px-2 py-1.5 shadow-md text-xs space-y-0.5">
                      <div className="font-semibold">Hari ke-{label}</div>
                      <div className="text-emerald-600">
                        ↘ Masuk: {formatRupiahShort(p.income)}
                      </div>
                      <div className="text-rose-600">
                        ↗ Keluar: {formatRupiahShort(p.expense)}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gIncome)"
                name="Pemasukan"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#f43f5e"
                strokeWidth={2}
                fill="url(#gExpense)"
                name="Pengeluaran"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-xs text-muted-foreground py-12">
            Belum ada data harian bulan ini.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
