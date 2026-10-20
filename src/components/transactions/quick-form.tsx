// Form pencatatan cepat transaksi (modal/bottom sheet)
// - State di-reset via key prop (React pattern yang direkomendasikan)
// - Tidak ada setState dalam useEffect
'use client';
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile as useMediaQuery } from "@/hooks/use-mobile";
import {
  useAccounts,
  useCategories,
  useCreateTransaction,
} from "@/hooks/use-data";
import { useSession } from "@/lib/session-store";
import {
  TRANSACTION_TYPES,
  AccountType,
} from "@/lib/constants";
import { toInputDate, parseRupiah, formatRupiah } from "@/lib/format";
import { Loader2, ArrowDown, ArrowUp, ArrowRight } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultType?: "INCOME" | "EXPENSE" | "TRANSFER";
};

export function QuickTransactionForm({
  open,
  onOpenChange,
  defaultType,
}: Props) {
  const isMobile = useMediaQuery();
  const isDesktop = !isMobile;
  const { user } = useSession();
  const { data: accounts } = useAccounts();
  const { data: catsIncome } = useCategories("INCOME");
  const { data: catsExpense } = useCategories("EXPENSE");
  const createTx = useCreateTransaction();

  // State - initialize with defaultType
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "TRANSFER">(
    defaultType ?? "EXPENSE"
  );
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => toInputDate(new Date()));
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");

  // Set default account kalau masih kosong - computed, no setState in effect
  const effectiveAccountId = useMemo(() => {
    if (accountId) return accountId;
    if (accounts?.length) return accounts[0].id;
    return "";
  }, [accountId, accounts]);

  const cats = type === "INCOME" ? catsIncome : type === "EXPENSE" ? catsExpense : [];

  const handleSubmit = async () => {
    if (!user) return;
    const amt = parseRupiah(amount);
    if (amt <= 0) {
      alert("Nominal harus > 0");
      return;
    }
    if (!effectiveAccountId) {
      alert("Pilih rekening");
      return;
    }
    if (type === "TRANSFER" && !toAccountId) {
      alert("Pilih rekening tujuan");
      return;
    }
    if ((type === "INCOME" || type === "EXPENSE") && !categoryId) {
      alert("Pilih kategori");
      return;
    }
    await createTx.mutateAsync({
      date,
      type,
      amount: amt,
      note: note.trim() || null,
      userId: user.id,
      accountId: effectiveAccountId,
      toAccountId: type === "TRANSFER" ? toAccountId : null,
      categoryId: type === "TRANSFER" ? null : categoryId,
    });
    onOpenChange(false);
  };

  // Handler ganti type - reset dependent state inline
  const handleTypeChange = (newType: "INCOME" | "EXPENSE" | "TRANSFER") => {
    setType(newType);
    setCategoryId("");
    if (newType !== "TRANSFER") setToAccountId("");
  };

  const typeButton = (key: "INCOME" | "EXPENSE" | "TRANSFER", label: string, Icon: any) => {
    const isActive = type === key;
    const color =
      key === "INCOME"
        ? "emerald"
        : key === "EXPENSE"
        ? "rose"
        : "amber";
    return (
      <button
        type="button"
        onClick={() => handleTypeChange(key)}
        className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-all border-2 ${
          isActive
            ? color === "emerald"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300"
              : color === "rose"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300"
            : "border-transparent text-muted-foreground hover:bg-muted/50"
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    );
  };

  const formContent = (
    <div className="space-y-4">
      {/* Jenis transaksi */}
      <div className="flex gap-2">
        {typeButton("INCOME", "Masuk", ArrowDown)}
        {typeButton("EXPENSE", "Keluar", ArrowUp)}
        {typeButton("TRANSFER", "Transfer", ArrowRight)}
      </div>

      {/* Nominal */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">Nominal (Rp)</Label>
        <Input
          id="amount"
          inputMode="numeric"
          autoFocus
          placeholder="0"
          value={amount ? formatRupiah(parseRupiah(amount), false) : ""}
          onChange={(e) => {
            const num = parseRupiah(e.target.value);
            setAmount(num ? String(num) : "");
          }}
          className="text-lg font-bold h-12 tabular-nums"
        />
      </div>

      {/* Tanggal */}
      <div className="space-y-1.5">
        <Label htmlFor="date">Tanggal</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Rekening sumber */}
      <div className="space-y-1.5">
        <Label>
          {type === "TRANSFER" ? "Dari Rekening" : "Rekening"}
        </Label>
        <Select
          value={effectiveAccountId}
          onValueChange={setAccountId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih rekening" />
          </SelectTrigger>
          <SelectContent>
            {accounts?.map((a: any) => (
              <SelectItem key={a.id} value={a.id}>
                {a.icon} {a.name} • {formatRupiah(a.balance, false)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rekening tujuan (untuk transfer) */}
      {type === "TRANSFER" && (
        <div className="space-y-1.5">
          <Label>Ke Rekening</Label>
          <Select value={toAccountId} onValueChange={setToAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih rekening tujuan" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                ?.filter((a: any) => a.id !== effectiveAccountId)
                .map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.icon} {a.name} • {formatRupiah(a.balance, false)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Kategori (untuk income/expense) */}
      {type !== "TRANSFER" && (
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {cats?.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Catatan */}
      <div className="space-y-1.5">
        <Label htmlFor="note">Catatan (opsional)</Label>
        <Textarea
          id="note"
          rows={2}
          placeholder="Contoh: Belanja bulanan di pasar"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Info user */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
        Dicatat oleh: <span className="font-semibold">{user?.name}</span>
      </div>
    </div>
  );

  const footer = (
    <Button
      onClick={handleSubmit}
      disabled={createTx.isPending}
      className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
    >
      {createTx.isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Menyimpan...
        </>
      ) : (
        `Simpan ${TRANSACTION_TYPES[type].label}`
      )}
    </Button>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Catat Transaksi</DialogTitle>
            <DialogDescription>
              Saldo rekening akan diperbarui otomatis.
            </DialogDescription>
          </DialogHeader>
          {formContent}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Catat Transaksi</DrawerTitle>
          <DrawerDescription>
            Saldo rekening diperbarui otomatis.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-2 overflow-y-auto">{formContent}</div>
        <DrawerFooter className="px-4 pt-2 border-t">
          {footer}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
