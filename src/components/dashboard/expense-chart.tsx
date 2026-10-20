// Grafik pengeluaran per kategori (donut) - pakai recharts
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatRupiah, formatRupiahShort, colorClass } from "@/lib/format";
import { PieChart as PieIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Warna donut
const DONUT_COLORS = [
  "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
  "#84cc16", "#ec4899", "#f97316", "#14b8a6", "#a855f7",
  "#22c55e", "#eab308", "#6366f1", "#0ea5e9",
];

export function ExpenseDonutChart({
  breakdown,
  isLoading,
  total,
}: {
  breakdown: any[];
  isLoading: boolean;
  total: number;
}) {
  const data = (breakdown ?? []).slice(0, 8);
  const other = (breakdown ?? [])
    .slice(8)
    .reduce((s, b) => s + b.total, 0);
  const finalData = [...data];
  if (other > 0) finalData.push({
    name: "Lainnya",
    icon: "📦",
    total: other,
    color: "slate",
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-emerald-600" />
          Pengeluaran per Kategori
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : finalData.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={75}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {finalData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload;
                      const pct = ((p.total / total) * 100).toFixed(1);
                      return (
                        <div className="bg-background border rounded-md px-2 py-1.5 shadow-md text-xs">
                          <div className="font-semibold">
                            {p.icon} {p.name}
                          </div>
                          <div>{formatRupiah(p.total)}</div>
                          <div className="text-muted-foreground">
                            {pct}% dari total
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[10px] text-muted-foreground">
                  Total
                </div>
                <div className="text-sm font-bold">
                  {formatRupiahShort(total)}
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-1.5 w-full">
              {finalData.map((b, i) => {
                const pct = total > 0 ? ((b.total / total) * 100).toFixed(1) : "0";
                return (
                  <div
                    key={b.name}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{
                        backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                      }}
                    />
                    <span className="flex-1 truncate">
                      {b.icon} {b.name}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatRupiahShort(b.total)}
                    </span>
                    <span className="text-muted-foreground w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground py-12">
            Belum ada pengeluaran bulan ini.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
