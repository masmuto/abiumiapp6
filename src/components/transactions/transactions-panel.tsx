// Panel daftar transaksi lengkap dengan filter
'use client';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTransactions,
  useDeleteTransaction,
  useAccounts,
} from "@/hooks/use-data";
import {
  formatTanggalPendek,
  formatRupiah,
  colorClass,
} from "@/lib/format";
import { TRANSACTION_TYPES } from "@/lib/constants";
import { Receipt, Trash2, Filter, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function TransactionsPanel({
  month,
  year,
  onQuickAdd,
}: {
  month: number;
  year: number;
  onQuickAdd?: () => void;
}) {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [accountFilter, setAccountFilter] = useState<string>("");
  const { data: accounts } = useAccounts();
  const { data: txs, isLoading } = useTransactions({
    month,
    year,
    type: typeFilter || undefined,
    accountId: accountFilter || undefined,
  });
  const del = useDeleteTransaction();

  // Group by date
  const grouped = (txs ?? []).reduce(
    (acc: Record<string, any[]>, t: any) => {
      const key = formatTanggalPendek(new Date(t.date));
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    },
    {} as Record<string, any[]>
  );
  const groups = Object.entries(grouped).sort(([a], [b]) => (a < b ? 1 : -1));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold">Riwayat Transaksi</h2>
          <p className="text-sm text-muted-foreground">
            {txs?.length ?? 0} transaksi bulan ini
          </p>
        </div>
        {onQuickAdd && (
          <Button onClick={onQuickAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Catat
          </Button>
        )}
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={typeFilter || "ALL"}
              onValueChange={(v) =>
                setTypeFilter(v === "ALL" ? "" : v)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Jenis</SelectItem>
                <SelectItem value="INCOME">Pemasukan</SelectItem>
                <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={accountFilter || "ALL"}
              onValueChange={(v) =>
                setAccountFilter(v === "ALL" ? "" : v)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Semua Rekening" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Rekening</SelectItem>
                {accounts?.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.icon} {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List grouped by date */}
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : groups.length > 0 ? (
        groups.map(([date, items]) => {
          const dayIncome = items
            .filter((t) => t.type === "INCOME")
            .reduce((s, t) => s + t.amount, 0);
          const dayExpense = items
            .filter((t) => t.type === "EXPENSE")
            .reduce((s, t) => s + t.amount, 0);
          return (
            <Card key={date}>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{date}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {dayIncome > 0 && (
                      <span className="text-emerald-600 mr-2">
                        +{formatRupiah(dayIncome, false)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-rose-600">
                        −{formatRupiah(dayExpense, false)}
                      </span>
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                {items.map((t) => {
                  const type =
                    TRANSACTION_TYPES[
                      t.type as keyof typeof TRANSACTION_TYPES
                    ];
                  const isIncome = t.type === "INCOME";
                  const isExpense = t.type === "EXPENSE";
                  const cls = colorClass(type?.color ?? "slate");
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <span className="text-xl shrink-0">
                        {t.category?.icon ?? "⇄"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {t.category?.name ?? "Transfer"}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded ${cls.bg} ${cls.text}`}
                          >
                            {type?.label}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {t.account?.name}
                          {t.toAccount ? ` → ${t.toAccount.name}` : ""}
                          {t.note ? ` • ${t.note}` : ""}
                          {` • ${t.user?.name ?? ""}`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`font-bold text-sm tabular-nums ${
                            isIncome
                              ? "text-emerald-600"
                              : isExpense
                              ? "text-rose-600"
                              : "text-amber-600"
                          }`}
                        >
                          {isIncome ? "+" : isExpense ? "−" : ""}
                          {formatRupiah(t.amount, false)}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Hapus transaksi ini?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Saldo rekening akan dikembalikan ke kondisi
                              sebelum transaksi ini.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => del.mutate(t.id)}
                              className="bg-rose-600 hover:bg-rose-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Belum ada transaksi bulan ini.</p>
            {onQuickAdd && (
              <Button onClick={onQuickAdd} size="sm" className="mt-3">
                <Plus className="w-4 h-4 mr-1" />
                Catat transaksi pertama
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
