// Daftar rekening dengan saldo berjalan
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah, colorClass } from "@/lib/format";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountList({
  accounts,
  isLoading,
  onAdd,
}: {
  accounts: any[];
  isLoading: boolean;
  onAdd?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-600" />
          Rekening &amp; Saldo
        </CardTitle>
        {onAdd && (
          <Button variant="ghost" size="sm" onClick={onAdd} className="h-7">
            <Plus className="w-3 h-3 mr-1" /> Tambah
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-1.5">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : accounts && accounts.length > 0 ? (
          accounts.map((a: any) => {
            const t = ACCOUNT_TYPES[a.type as keyof typeof ACCOUNT_TYPES];
            return (
              <div
                key={a.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">
                    {a.icon ?? t?.icon ?? "💳"}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{a.name}</div>
                    <div
                      className={`text-[10px] px-1.5 py-0.5 rounded inline-block ${colorClass(t?.color ?? "slate").bg} ${colorClass(t?.color ?? "slate").text}`}
                    >
                      {t?.label ?? a.type}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`font-bold text-sm tabular-nums ${
                      a.balance >= 0 ? "" : "text-rose-600"
                    }`}
                  >
                    {formatRupiah(a.balance)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Awal: {formatRupiah(a.initialBalance, false)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-xs text-muted-foreground py-4">
            Belum ada rekening.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
