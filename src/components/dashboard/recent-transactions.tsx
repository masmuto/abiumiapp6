// Transaksi terkini (10 terakhir)
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTanggalPendek, formatRupiah, colorClass } from "@/lib/format";
import { TRANSACTION_TYPES } from "@/lib/constants";
import { Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function RecentTransactions({
  transactions,
  isLoading,
  onDelete,
  onSeeAll,
}: {
  transactions: any[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  onSeeAll?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          Transaksi Terkini
        </CardTitle>
        {onSeeAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSeeAll}
            className="h-7 text-emerald-700"
          >
            Lihat semua
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-1 max-h-96 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))
        ) : transactions && transactions.length > 0 ? (
          transactions.map((t: any) => {
            const type = TRANSACTION_TYPES[t.type as keyof typeof TRANSACTION_TYPES];
            const isIncome = t.type === "INCOME";
            const isExpense = t.type === "EXPENSE";
            const isTransfer = t.type === "TRANSFER";
            const cls = colorClass(type?.color ?? "slate");
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-xl shrink-0" aria-hidden>
                  {t.category?.icon ?? (isTransfer ? "⇄" : "📝")}
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
                    {formatTanggalPendek(new Date(t.date))}
                    {t.note ? ` • ${t.note}` : ""}
                    {` • ${t.user?.name ?? ""}`}
                    {` • ${t.account?.name ?? ""}`}
                    {isTransfer && t.toAccount
                      ? ` → ${t.toAccount.name}`
                      : ""}
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
                {onDelete && (
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
                        <AlertDialogTitle>Hapus transaksi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini akan menghapus transaksi & membalik
                          saldo rekening. Tidak bisa dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(t.id)}
                          className="bg-rose-600 hover:bg-rose-700"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-center text-xs text-muted-foreground py-6">
            Belum ada transaksi bulan ini. Tekan tombol{" "}
            <span className="font-semibold text-emerald-700">+</span> untuk
            catat cepat.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
