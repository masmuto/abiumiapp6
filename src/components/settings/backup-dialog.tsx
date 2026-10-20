// Dialog Backup & Restore Database
// Akses dari menu user dropdown → "Cadangkan Data"
'use client';
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Database,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  Info,
  FileJson,
} from "lucide-react";
import { toast } from "sonner";
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
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function BackupDialog({ open, onOpenChange }: Props) {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedSummary, setParsedSummary] = useState<any>(null);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === Backup (download JSON) ===
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const r = await fetch("/api/backup");
      if (!r.ok) {
        const e = await r.json().catch(() => ({ error: "Gagal backup" }));
        throw new Error(e.error || "Gagal backup");
      }
      const data = await r.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-keuangan-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(
        `Backup berhasil: ${data.stats?.transactions ?? 0} transaksi, ${data.stats?.accounts ?? 0} rekening`
      );
    } catch (e: any) {
      toast.error("Backup gagal: " + e.message);
    } finally {
      setBackupLoading(false);
    }
  };

  // === File picker untuk restore ===
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setRestoreResult(null);
    // Parse & preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.data) {
          toast.error("File bukan backup yang valid");
          setSelectedFile(null);
          return;
        }
        setParsedSummary({
          version: json.version,
          exportedAt: json.exportedAt,
          source: json.source,
          stats: json.stats,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + " KB",
        });
        toast.success("File backup dimuat. Klik \"Restore\" untuk lanjut.");
      } catch (err: any) {
        toast.error("File bukan JSON valid: " + err.message);
        setSelectedFile(null);
      }
    };
    reader.readAsText(file);
  };

  // === Restore (upload & upsert) ===
  const handleRestore = async () => {
    if (!selectedFile || !parsedSummary) {
      toast.error("Pilih file backup dulu");
      return;
    }
    setRestoreLoading(true);
    try {
      // Re-read file untuk kirim sebagai JSON
      const text = await selectedFile.text();
      const json = JSON.parse(text);
      const r = await fetch(`/api/restore?mode=${restoreMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const result = await r.json();
      if (!r.ok) {
        throw new Error(result.error || "Gagal restore");
      }
      setRestoreResult(result.data);
      toast.success(
        `Restore selesai: ${result.data?.totalRows?.transactions ?? 0} transaksi, ${result.data?.totalRows?.accounts ?? 0} rekening`
      );
      // Reload app supaya semua data refresh
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      toast.error("Restore gagal: " + e.message);
    } finally {
      setRestoreLoading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setParsedSummary(null);
    setRestoreResult(null);
    setRestoreMode("merge");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            Cadangkan &amp; Pulihkan Data
          </DialogTitle>
          <DialogDescription>
            Backup semua data keuangan keluarga sebagai file JSON, atau
            pulihkan dari backup sebelumnya.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* === Section: Backup === */}
          <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">
                    Backup Data (Unduh)
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Simpan semua data (users, rekening, transaksi, anggaran,
                    aset, kewajiban) sebagai file JSON. Simpan di tempat aman
                    sebagai cadangan.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleBackup}
                disabled={backupLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {backupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sedang backup...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1" />
                    Download Backup JSON
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* === Section: Restore === */}
          <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">
                    Pulihkan Data (Restore)
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pilih file backup JSON sebelumnya untuk mengembalikan
                    data. Mode <strong>merge</strong> tidak menghapus data
                    lain, mode <strong>replace</strong> menghapus semua dulu.
                  </p>
                </div>
              </div>

              {/* File picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-amber-600 file:text-white file:font-medium file:cursor-pointer file:hover:bg-amber-700"
              />

              {/* Parsed summary */}
              {parsedSummary && (
                <div className="rounded-md bg-background border p-3 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <FileJson className="w-3.5 h-3.5" />
                    {parsedSummary.fileName}
                  </div>
                  <div className="text-muted-foreground">
                    Ukuran: {parsedSummary.fileSize} • Backup dibuat:{" "}
                    {new Date(parsedSummary.exportedAt).toLocaleString("id-ID")}
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {Object.entries(parsedSummary.stats ?? {}).map(
                      ([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {k}:
                          </span>
                          <span className="font-medium">{String(v)}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Mode radio */}
              {selectedFile && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Mode Restore:</Label>
                  <RadioGroup
                    value={restoreMode}
                    onValueChange={(v) =>
                      setRestoreMode(v as "merge" | "replace")
                    }
                    className="space-y-1"
                  >
                    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50">
                      <RadioGroupItem value="merge" id="merge" className="mt-0.5" />
                      <Label
                        htmlFor="merge"
                        className="text-xs cursor-pointer flex-1"
                      >
                        <span className="font-semibold">Merge</span> — tambah
                        /update data dari backup, data lain tetap ada (aman)
                      </Label>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50">
                      <RadioGroupItem
                        value="replace"
                        id="replace"
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="replace"
                        className="text-xs cursor-pointer flex-1"
                      >
                        <span className="font-semibold text-rose-600">
                          Replace
                        </span>{" "}
                        — hapus semua data lama, ganti dengan isi backup
                        (hati-hati!)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Restore result */}
              {restoreResult && (
                <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 p-3 text-xs space-y-1">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Restore berhasil!
                  </div>
                  <div className="text-muted-foreground">
                    Mode: {restoreResult.mode} • Waktu:{" "}
                    {new Date(restoreResult.restoredAt).toLocaleString("id-ID")}
                  </div>
                </div>
              )}

              {/* Restore button */}
              {selectedFile && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={restoreLoading}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      {restoreLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sedang restore...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-1" />
                          Restore Sekarang ({restoreMode === "replace" ? "Hapus Data Lama" : "Merge"})
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Konfirmasi Restore Data?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {restoreMode === "replace" ? (
                          <span className="text-rose-600 font-medium">
                            ⚠️ PERINGATAN: Mode replace akan MENGHAPUS SEMUA
                            data yang ada sekarang, lalu menggantinya dengan
                            isi backup. Tindakan ini tidak bisa dibatalkan.
                          </span>
                        ) : (
                          <>Mode merge akan menambah/memperbarui data dari backup. Data lain tetap ada.</>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRestore}
                        className={
                          restoreMode === "replace"
                            ? "bg-rose-600 hover:bg-rose-700"
                            : "bg-amber-600 hover:bg-amber-700"
                        }
                      >
                        Ya, Restore
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>

          {/* === Section: Other export options === */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="font-semibold text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                Opsi Ekspor Lainnya
              </div>
              <div className="space-y-2">
                <a
                  href="/?action=report"
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Export Excel &amp; PDF laporan bulan ini
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
                <a
                  href="https://supabase.com/dashboard/project/mtgmwgawjcscgammixnu/editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    Buka Supabase Dashboard (Table Editor)
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* === Info box === */}
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <div className="font-semibold mb-1">💡 Tips Backup Berkala:</div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Backup minimal sebulan sekali (mis. tanggal gajian)</li>
              <li>Simpan file backup di Google Drive / Dropbox / flashdisk</li>
              <li>Sebelum reset HP / ganti HP, backup dulu</li>
              <li>File JSON berisi semua data — simpan di tempat aman</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
