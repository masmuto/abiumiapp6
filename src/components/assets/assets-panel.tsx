// Panel aset & kewajiban dengan kalkulasi net worth
// Sekarang juga mengelola Rekening (CRUD) sebagai sub-tab pertama
'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useLiabilities,
  useCreateLiability,
  useUpdateLiability,
  useDeleteLiability,
} from "@/hooks/use-data";
import {
  ASSET_TYPES,
  AssetType,
} from "@/lib/constants";
import {
  formatRupiah,
  parseRupiah,
  toInputDate,
} from "@/lib/format";
import {
  Plus,
  Pencil,
  Trash2,
  Layers,
  Scale,
  Loader2,
  TrendingUp,
} from "lucide-react";
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
import { AccountsPanel } from "@/components/accounts/accounts-panel";

type AssetSubTab = "rekening" | "assets" | "liabilities";

export function AssetsPanel({
  initialTab = "rekening",
}: {
  initialTab?: AssetSubTab;
}) {
  const [activeTab, setActiveTab] = useState<AssetSubTab>(initialTab);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Rekening, Aset &amp; Kewajiban</h2>
        <p className="text-sm text-muted-foreground">
          Kelola sumber dana keluarga, lacak emas/dinar/utang. Kekayaan bersih
          dihitung otomatis.
        </p>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AssetSubTab)}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rekening">💵 Rekening</TabsTrigger>
          <TabsTrigger value="assets">🪙 Aset</TabsTrigger>
          <TabsTrigger value="liabilities">📋 Kewajiban</TabsTrigger>
        </TabsList>
        <TabsContent value="rekening" className="mt-3">
          <AccountsPanel />
        </TabsContent>
        <TabsContent value="assets" className="mt-3">
          <AssetsList />
        </TabsContent>
        <TabsContent value="liabilities" className="mt-3">
          <LiabilitiesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssetsList() {
  const { data: assets, isLoading } = useAssets();
  const createA = useCreateAsset();
  const updateA = useUpdateAsset();
  const deleteA = useDeleteAsset();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("GOLD");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [note, setNote] = useState("");

  const reset = () => {
    setEditing(null);
    setName("");
    setType("GOLD");
    setQuantity("1");
    setUnitPrice("");
    setNote("");
  };

  const openCreate = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setName(a.name);
    setType(a.type);
    setQuantity(String(a.quantity));
    setUnitPrice(String(a.unitPrice));
    setNote(a.note ?? "");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!name || !type) {
      alert("Nama & jenis wajib");
      return;
    }
    const body = {
      name,
      type,
      quantity: parseFloat(quantity) || 1,
      unitPrice: parseRupiah(unitPrice),
      note: note.trim() || null,
    };
    if (editing) {
      await updateA.mutateAsync({ id: editing.id, ...body });
    } else {
      await createA.mutateAsync(body);
    }
    setOpen(false);
    reset();
  };

  const total = (assets ?? []).reduce((s: number, a: any) => s + a.value, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="text-muted-foreground">Total Aset: </span>
          <span className="font-bold text-emerald-700">
            {formatRupiah(total)}
          </span>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : assets && assets.length > 0 ? (
          assets.map((a: any) => {
            const t = ASSET_TYPES[a.type as keyof typeof ASSET_TYPES];
            return (
              <Card key={a.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">
                        {t?.icon ?? "💼"}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {a.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t?.label}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
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
                            <AlertDialogTitle>Hapus aset?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Aset &quot;{a.name}&quot; akan dihapus permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteA.mutate(a.id)}
                              className="bg-rose-600 hover:bg-rose-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-xs text-muted-foreground">
                      {a.quantity} × {formatRupiah(a.unitPrice, false)}
                    </div>
                    <div className="text-lg font-bold tabular-nums">
                      {formatRupiah(a.value)}
                    </div>
                  </div>
                  {a.note && (
                    <div className="text-xs text-muted-foreground italic">
                      {a.note}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="sm:col-span-2">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Belum ada aset tercatat.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Aset" : "Tambah Aset"}
            </DialogTitle>
            <DialogDescription>
              Untuk emas/dinar, masukkan harga per gram/keping dan jumlah unit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Aset</Label>
              <Input
                placeholder="Contoh: Emas Antam 10gr"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Jenis</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as AssetType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.icon} {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Jumlah</Label>
                <Input
                  inputMode="decimal"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Harga/Unit (Rp)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={
                    unitPrice
                      ? formatRupiah(parseRupiah(unitPrice), false)
                      : ""
                  }
                  onChange={(e) => {
                    const n = parseRupiah(e.target.value);
                    setUnitPrice(n ? String(n) : "");
                  }}
                />
              </div>
            </div>
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 p-2 text-sm">
              <span className="text-muted-foreground">Nilai Total: </span>
              <span className="font-bold text-emerald-700">
                {formatRupiah(
                  (parseFloat(quantity) || 0) * parseRupiah(unitPrice)
                )}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createA.isPending || updateA.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {(createA.isPending || updateA.isPending) && (
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

function LiabilitiesList() {
  const { data: liabilities, isLoading } = useLiabilities();
  const createL = useCreateLiability();
  const updateL = useUpdateLiability();
  const deleteL = useDeleteLiability();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  const reset = () => {
    setEditing(null);
    setName("");
    setAmount("");
    setDueDate("");
    setNote("");
  };

  const openCreate = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (l: any) => {
    setEditing(l);
    setName(l.name);
    setAmount(String(l.amount));
    setDueDate(l.dueDate ? toInputDate(new Date(l.dueDate)) : "");
    setNote(l.note ?? "");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!name) {
      alert("Nama wajib");
      return;
    }
    const body = {
      name,
      amount: parseRupiah(amount),
      dueDate: dueDate || null,
      note: note.trim() || null,
    };
    if (editing) {
      await updateL.mutateAsync({ id: editing.id, ...body });
    } else {
      await createL.mutateAsync(body);
    }
    setOpen(false);
    reset();
  };

  const total = (liabilities ?? []).reduce(
    (s: number, l: any) => s + (l.settled ? 0 : l.amount),
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="text-muted-foreground">Total Utang: </span>
          <span className="font-bold text-rose-700">{formatRupiah(total)}</span>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : liabilities && liabilities.length > 0 ? (
          liabilities.map((l: any) => (
            <Card
              key={l.id}
              className={l.settled ? "opacity-60" : ""}
            >
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">📋</span>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {l.name}
                      </div>
                      {l.dueDate && (
                        <div className="text-xs text-muted-foreground">
                          Jatuh tempo:{" "}
                          {new Date(l.dueDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(l)}
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
                            Hapus kewajiban?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            &quot;{l.name}&quot; akan dihapus permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteL.mutate(l.id)}
                            className="bg-rose-600 hover:bg-rose-700"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <Button
                    variant={l.settled ? "secondary" : "outline"}
                    size="sm"
                    onClick={() =>
                      updateL.mutate({ id: l.id, settled: !l.settled })
                    }
                  >
                    {l.settled ? "Lunas ✓" : "Tandai lunas"}
                  </Button>
                  <div className="text-lg font-bold tabular-nums">
                    {formatRupiah(l.amount)}
                  </div>
                </div>
                {l.note && (
                  <div className="text-xs text-muted-foreground italic">
                    {l.note}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="sm:col-span-2">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              <Scale className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Tidak ada kewajiban tercatat. Alhamdulillah 🤲</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Kewajiban" : "Tambah Kewajiban (Utang)"}
            </DialogTitle>
            <DialogDescription>
              Catat utang agar ikut dihitung dalam kekayaan bersih.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama</Label>
              <Input
                placeholder="Contoh: Utang ke Bapak"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nominal (Rp)</Label>
              <Input
                inputMode="numeric"
                placeholder="0"
                value={
                  amount ? formatRupiah(parseRupiah(amount), false) : ""
                }
                onChange={(e) => {
                  const n = parseRupiah(e.target.value);
                  setAmount(n ? String(n) : "");
                }}
                className="font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Jatuh Tempo (opsional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createL.isPending || updateL.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {(createL.isPending || updateL.isPending) && (
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
