// Panel manajemen rekening: tambah/edit/hapus + koreksi saldo
'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "@/hooks/use-data";
import {
  ACCOUNT_TYPES,
  AccountType,
} from "@/lib/constants";
import {
  formatRupiah,
  parseRupiah,
} from "@/lib/format";
import {
  Plus,
  Wallet,
  Pencil,
  Trash2,
  Banknote,
  Loader2,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

export function AccountsPanel() {
  const { data: accounts, isLoading } = useAccounts();
  const createAcc = useCreateAccount();
  const updateAcc = useUpdateAccount();
  const deleteAcc = useDeleteAccount();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CASH");
  const [icon, setIcon] = useState("💵");
  const [initialBalance, setInitialBalance] = useState("");
  const [adjustBalance, setAdjustBalance] = useState("");

  const reset = () => {
    setEditing(null);
    setName("");
    setType("CASH");
    setIcon("💵");
    setInitialBalance("");
    setAdjustBalance("");
  };

  const openCreate = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setName(a.name);
    setType(a.type);
    setIcon(a.icon ?? "");
    setInitialBalance(String(a.initialBalance));
    setAdjustBalance(String(a.balance));
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!name || !type) {
      alert("Nama & jenis wajib");
      return;
    }
    if (editing) {
      const body: any = { name, type, icon: icon || undefined };
      if (adjustBalance !== String(editing.balance)) {
        body.adjustBalance = parseRupiah(adjustBalance);
      }
      await updateAcc.mutateAsync({ id: editing.id, ...body });
    } else {
      await createAcc.mutateAsync({
        name,
        type,
        icon: icon || undefined,
        initialBalance: parseRupiah(initialBalance),
      });
    }
    setOpen(false);
    reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Saldo diperbarui otomatis dari transaksi.
        </p>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Tambah Rekening
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : (
          accounts?.map((a: any) => {
            const t = ACCOUNT_TYPES[a.type as keyof typeof ACCOUNT_TYPES];
            return (
              <Card key={a.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{a.icon ?? t?.icon}</span>
                      <div>
                        <div className="font-semibold">{a.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t?.label}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(a)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Hapus rekening &quot;{a.name}&quot;?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Jika ada transaksi, rekening akan diarsipkan.
                              Jika kosong, akan dihapus permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAcc.mutate(a.id)}
                              className="bg-rose-600 hover:bg-rose-700"
                            >
                              Lanjut
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Saldo Berjalan
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                      {formatRupiah(a.balance)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Saldo awal: {formatRupiah(a.initialBalance)}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog form */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Rekening" : "Tambah Rekening"}
            </DialogTitle>
            <DialogDescription>
              Saldo berjalan auto-update dari transaksi. Untuk koreksi manual,
              ubah &quot;Saldo Saat Ini&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Rekening</Label>
              <Input
                placeholder="Contoh: Bank BCA"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Jenis</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as AccountType);
                  setIcon(ACCOUNT_TYPES[v as AccountType]?.icon ?? "💳");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.icon} {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ikon (emoji)</Label>
              <Input
                placeholder="💵"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={4}
              />
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <Label>Saldo Awal (Rp)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={
                    initialBalance
                      ? formatRupiah(parseRupiah(initialBalance), false)
                      : ""
                  }
                  onChange={(e) => {
                    const n = parseRupiah(e.target.value);
                    setInitialBalance(n ? String(n) : "");
                  }}
                />
              </div>
            )}
            {editing && (
              <div className="space-y-1.5">
                <Label>Saldo Saat Ini (koreksi)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={
                    adjustBalance
                      ? formatRupiah(parseRupiah(adjustBalance), false)
                      : ""
                  }
                  onChange={(e) => {
                    const n = parseRupiah(e.target.value);
                    setAdjustBalance(n ? String(n) : "");
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Hanya ubah jika perlu koreksi manual.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createAcc.isPending || updateAcc.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {(createAcc.isPending || updateAcc.isPending) && (
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
