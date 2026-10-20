// Panel anggaran bulanan per kategori dengan progress realisasi
'use client';
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBudgets,
  useCategories,
  useUpsertBudget,
  useDeleteBudget,
} from "@/hooks/use-data";
import {
  formatRupiah,
  parseRupiah,
} from "@/lib/format";
import { MONTHS_ID } from "@/lib/constants";
import {
  Plus,
  PiggyBank,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/session-store";

export function BudgetPanel({
  month,
  year,
}: {
  month: number;
  year: number;
}) {
  const { user } = useSession();
  const { data: budgets, isLoading } = useBudgets(month, year);
  const { data: cats } = useCategories("EXPENSE");
  const upsert = useUpsertBudget();
  const del = useDeleteBudget();

  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");

  // Kategori yang belum dianggarkan
  const budgetedIds = useMemo(
    () => new Set((budgets ?? []).map((b: any) => b.categoryId)),
    [budgets]
  );
  const availableCats = (cats ?? []).filter(
    (c: any) => !budgetedIds.has(c.id)
  );

  const handleSubmit = async () => {
    if (!categoryId || !user) {
      alert("Pilih kategori");
      return;
    }
    const amt = parseRupiah(amount);
    if (amt <= 0) {
      alert("Nominal > 0");
      return;
    }
    await upsert.mutateAsync({
      month,
      year,
      amount: amt,
      categoryId,
      userId: user.id,
    });
    setOpen(false);
    setCategoryId("");
    setAmount("");
  };

  const totalBudget = (budgets ?? []).reduce(
    (s: number, b: any) => s + b.amount,
    0
  );
  const totalSpent = (budgets ?? []).reduce(
    (s: number, b: any) => s + b.spent,
    0
  );
  const overall = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">
            Anggaran {MONTHS_ID[month - 1]} {year}
          </h2>
          <p className="text-sm text-muted-foreground">
            Target vs realisasi per kategori pengeluaran.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          size="sm"
          disabled={availableCats.length === 0}
        >
          <Plus className="w-4 h-4 mr-1" />
          Tambah
        </Button>
      </div>

      {/* Ringkasan total */}
      <Card className="bg-gradient-to-br from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/30 border-amber-200/50 dark:border-amber-800/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground">
                Total Realisasi / Anggaran
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {formatRupiah(totalSpent)}
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / {formatRupiah(totalBudget)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Progress</div>
              <div
                className={`text-2xl font-bold ${
                  overall > 100 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {overall.toFixed(0)}%
              </div>
            </div>
          </div>
          <Progress
            value={Math.min(overall, 100)}
            className="h-2"
            indicatorClassName={
              overall > 100
                ? "bg-rose-500"
                : overall > 80
                ? "bg-amber-500"
                : "bg-emerald-500"
            }
          />
        </CardContent>
      </Card>

      {/* List anggaran */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : budgets && budgets.length > 0 ? (
          budgets.map((b: any) => {
            const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
            const over = pct > 100;
            return (
              <Card key={b.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{b.category?.icon}</span>
                      <div>
                        <div className="font-medium text-sm">
                          {b.category?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatRupiah(b.spent)} / {formatRupiah(b.amount)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {over ? (
                        <span className="text-rose-600 text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Lebih {(pct - 100).toFixed(0)}%
                        </span>
                      ) : pct > 80 ? (
                        <span className="text-amber-600 text-xs">
                          Hampir habis
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aman
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-rose-600"
                        onClick={() => del.mutate(b.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className="h-1.5"
                    indicatorClassName={
                      over
                        ? "bg-rose-500"
                        : pct > 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }
                  />
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              <PiggyBank className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Belum ada anggaran bulan ini.</p>
              <p className="text-xs mt-1">
                Tekan tombol &quot;Tambah&quot; untuk menambah kategori
                yang dianggarkan (SPP, makan, listrik, dll).
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog tambah anggaran */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Anggaran</DialogTitle>
            <DialogDescription>
              Pilih kategori pengeluaran dan target bulan{" "}
              {MONTHS_ID[month - 1]} {year}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {availableCats.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target Anggaran (Rp)</Label>
              <Input
                inputMode="numeric"
                placeholder="0"
                value={amount ? formatRupiah(parseRupiah(amount), false) : ""}
                onChange={(e) => {
                  const n = parseRupiah(e.target.value);
                  setAmount(n ? String(n) : "");
                }}
                className="font-bold"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={upsert.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {upsert.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
