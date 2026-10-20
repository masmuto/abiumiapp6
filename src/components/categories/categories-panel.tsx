// Panel kelola kategori: tambah, edit, hapus kategori transaksi
// Akses dari menu user dropdown → "Kelola Kategori"
'use client';
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/use-data";
import {
  formatRupiah,
  colorClass,
} from "@/lib/format";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Tag,
  Inbox,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Palet warna untuk pilihan user
const COLOR_OPTIONS = [
  { name: "emerald", label: "Hijau", hex: "#10b981" },
  { name: "teal", label: "Toska", hex: "#14b8a6" },
  { name: "amber", label: "Kuning", hex: "#f59e0b" },
  { name: "rose", label: "Merah", hex: "#f43f5e" },
  { name: "lime", label: "Lime", hex: "#84cc16" },
  { name: "yellow", label: "Emas", hex: "#eab308" },
  { name: "sky", label: "Biru Muda", hex: "#0ea5e9" },
  { name: "slate", label: "Abu", hex: "#64748b" },
];

// Emoji saran untuk kategori umum
const EMOJI_SUGGESTIONS = [
  "💰", "🎁", "🕌", "🛒", "🎀", "🤝", "📊", "📥",
  "🎓", "👛", "🍱", "🛍", "💡", "🚰", "🏠", "📶",
  "⛽", "🚗", "🏥", "💊", "📚", "✏️", "🤲", "🌟",
  "🐷", "🪙", "📈", "🏞️", "🎮", "📤", "💼", "🍔",
  "☕", "🥖", "🍎", "👕", "🧾", "💳", "📱", "🔌",
];

export function CategoriesPanel() {
  const { data: allCategories, isLoading } = useCategories();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("emerald");

  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  // Filter kategori per type + search
  const incomeCats = useMemo(() => {
    const filtered = (allCategories ?? []).filter((c: any) => c.type === "INCOME");
    if (!search) return filtered;
    const q = search.toLowerCase();
    return filtered.filter((c: any) =>
      c.name.toLowerCase().includes(q) || c.icon?.includes(q)
    );
  }, [allCategories, search]);

  const expenseCats = useMemo(() => {
    const filtered = (allCategories ?? []).filter((c: any) => c.type === "EXPENSE");
    if (!search) return filtered;
    const q = search.toLowerCase();
    return filtered.filter((c: any) =>
      c.name.toLowerCase().includes(q) || c.icon?.includes(q)
    );
  }, [allCategories, search]);

  const reset = () => {
    setEditing(null);
    setName("");
    setType("EXPENSE");
    setIcon("📦");
    setColor("emerald");
  };

  const openCreate = (defaultType: "INCOME" | "EXPENSE" = "EXPENSE") => {
    reset();
    setType(defaultType);
    setOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setIcon(c.icon ?? "📦");
    setColor(c.color ?? "emerald");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }
    const body = {
      name: name.trim(),
      type,
      icon: icon || undefined,
      color,
    };
    if (editing) {
      await updateCat.mutateAsync({ id: editing.id, ...body });
    } else {
      await createCat.mutateAsync(body);
    }
    setOpen(false);
    reset();
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {allCategories?.length ?? 0} kategori • Tambah/edit/hapus sesuai kebutuhan keluarga
        </p>
        <div className="flex gap-1.5">
          <Button
            onClick={() => openCreate("EXPENSE")}
            size="sm"
            variant="outline"
            className="border-rose-200 text-rose-700 hover:bg-rose-50 h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Kategori Pengeluaran
          </Button>
          <Button
            onClick={() => openCreate("INCOME")}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Kategori Pemasukan
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Tabs: Pemasukan / Pengeluaran */}
      <Tabs defaultValue="expense">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense">
            Pengeluaran ({expenseCats.length})
          </TabsTrigger>
          <TabsTrigger value="income">
            Pemasukan ({incomeCats.length})
          </TabsTrigger>
        </TabsList>

        {/* Pengeluaran */}
        <TabsContent value="expense" className="mt-2 space-y-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))
          ) : expenseCats.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-1.5">
              {expenseCats.map((c: any) => (
                <CategoryRow
                  key={c.id}
                  category={c}
                  onEdit={() => openEdit(c)}
                  onDelete={() => deleteCat.mutate(c.id)}
                  isDefault={c.isDefault}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              type="EXPENSE"
              search={search}
              onCreate={() => openCreate("EXPENSE")}
            />
          )}
        </TabsContent>

        {/* Pemasukan */}
        <TabsContent value="income" className="mt-2 space-y-1">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))
          ) : incomeCats.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-1.5">
              {incomeCats.map((c: any) => (
                <CategoryRow
                  key={c.id}
                  category={c}
                  onEdit={() => openEdit(c)}
                  onDelete={() => deleteCat.mutate(c.id)}
                  isDefault={c.isDefault}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              type="INCOME"
              search={search}
              onCreate={() => openCreate("INCOME")}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog form tambah/edit */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              {editing ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Ubah nama, ikon, atau warna kategori."
                : "Buat kategori baru untuk pencatatan transaksi."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Jenis */}
            <div className="space-y-1.5">
              <Label>Jenis Transaksi</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("INCOME")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                    type === "INCOME"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : "border-transparent text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  ↘ Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setType("EXPENSE")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                    type === "EXPENSE"
                      ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300"
                      : "border-transparent text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  ↗ Pengeluaran
                </button>
              </div>
            </div>

            {/* Nama */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nama Kategori</Label>
              <Input
                id="cat-name"
                placeholder="Contoh: SPP Anak, Biaya Internet, THR"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>

            {/* Ikon emoji */}
            <div className="space-y-1.5">
              <Label>Ikon (emoji)</Label>
              <Input
                placeholder="📦"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={4}
                className="text-center text-xl"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {EMOJI_SUGGESTIONS.slice(0, 24).map((e, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(e)}
                    className={`w-7 h-7 rounded-md text-lg leading-none hover:bg-muted transition-colors ${
                      icon === e ? "bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-400" : ""
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Warna */}
            <div className="space-y-1.5">
              <Label>Warna (untuk chip)</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border-2 transition-all ${
                      color === c.name
                        ? "border-foreground"
                        : "border-transparent hover:bg-muted"
                    }`}
                    style={{ backgroundColor: c.hex + "33", color: c.hex }}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-md bg-muted/50 p-2.5 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <span
                className={`text-xs px-2 py-0.5 rounded inline-flex items-center gap-1 ${colorClass(color).bg} ${colorClass(color).text}`}
              >
                {icon} {name || "Nama kategori"}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createCat.isPending || updateCat.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {(createCat.isPending || updateCat.isPending) && (
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

// === Row kategori (Card mini) ===
function CategoryRow({
  category,
  onEdit,
  onDelete,
  isDefault,
}: {
  category: any;
  onEdit: () => void;
  onDelete: () => void;
  isDefault?: boolean;
}) {
  const cls = colorClass(category.color ?? "slate");
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all">
      <span className="text-lg shrink-0">{category.icon ?? "📦"}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate flex items-center gap-1.5">
          {category.name}
          {isDefault && (
            <span className="text-[9px] px-1 py-0 rounded bg-muted text-muted-foreground font-normal">
              default
            </span>
          )}
        </div>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded ${cls.bg} ${cls.text}`}
        >
          {category.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
        </span>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
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
                Hapus kategori &quot;{category.name}&quot;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Kategori hanya bisa dihapus kalau tidak dipakai transaksi
                manapun. Kalau sudah dipakai, kategori harus tetap ada (atau
                gabung dengan kategori lain).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// === Empty state ===
function EmptyState({
  type,
  search,
  onCreate,
}: {
  type: "INCOME" | "EXPENSE";
  search: string;
  onCreate: () => void;
}) {
  return (
    <div className="text-center py-8 px-4">
      <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm text-muted-foreground mb-1">
        {search
          ? `Tidak ada kategori yang cocok dengan "${search}"`
          : `Belum ada kategori ${type === "INCOME" ? "pemasukan" : "pengeluaran"}`}
      </p>
      <Button onClick={onCreate} size="sm" variant="outline" className="mt-2">
        <Plus className="w-3.5 h-3.5 mr-1" />
        Tambah Kategori
      </Button>
    </div>
  );
}

// === Wrapper Dialog untuk akses dari menu user dropdown ===
export function CategoriesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            Kelola Kategori
          </DialogTitle>
          <DialogDescription>
            Tambah, edit, atau hapus kategori untuk pemasukan &amp;
            pengeluaran. Perubahan langsung tersimpan ke Supabase.
          </DialogDescription>
        </DialogHeader>
        <CategoriesPanel />
      </DialogContent>
    </Dialog>
  );
}
