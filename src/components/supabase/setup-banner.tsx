// Komponen: Setup wizard untuk Supabase
// Muncul otomatis saat app mendeteksi tabel belum ada (needsMigration=true)
// Memberi instruksi langkah-langkah + tombol copy SQL
'use client';
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Database,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Status = "checking" | "ready" | "needs-migration" | "error";

export function SupabaseSetupBanner() {
  const [status, setStatus] = useState<Status>("checking");
  const [showWizard, setShowWizard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const checkStatus = async () => {
    try {
      setStatus("checking");
      console.log("[SetupBanner] Checking Supabase status...");
      const r = await fetch("/api");
      const data = await r.json();
      console.log("[SetupBanner] /api response:", data);
      setStats(data);
      if (data?.stats?.needsMigration) {
        console.log("[SetupBanner] Status: needs-migration");
        setStatus("needs-migration");
        setShowWizard(true);
      } else if (data?.stats?.connected) {
        console.log("[SetupBanner] Status: ready");
        setStatus("ready");
      } else if (data?.stats?.error) {
        console.log("[SetupBanner] Status: error");
        setStatus("error");
      }
    } catch (e: any) {
      console.error("[SetupBanner] Check failed:", e);
      setStatus("error");
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleCopySQL = async () => {
    try {
      const r = await fetch("/api/setup-sql");
      const text = await r.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("SQL disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) {
      toast.error("Gagal salin: " + e.message);
    }
  };

  const handleRefresh = () => {
    checkStatus();
  };

  // Tidak tampilkan apa-apa bila status ready atau checking
  if (status === "ready" || status === "checking") return null;

  return (
    <>
      {/* Banner kecil di atas header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-amber-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow-md">
        <AlertCircle className="w-4 h-4" />
        <span>Database Supabase belum disetup.</span>
        <button
          onClick={() => setShowWizard(true)}
          className="underline hover:no-underline font-semibold"
        >
          Panduan setup
        </button>
      </div>

      {/* Dialog wizard */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              Setup Database Supabase
            </DialogTitle>
            <DialogDescription>
              Untuk mulai pakai aplikasi dengan cloud sync, ikuti langkah berikut.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1">Buka Supabase SQL Editor</div>
                <p className="text-muted-foreground text-xs mb-2">
                  Login ke{" "}
                  <a
                    href="https://supabase.com/dashboard/project/mtgmwgawjcscgammixnu/sql/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 underline inline-flex items-center gap-1"
                  >
                    Supabase Dashboard → SQL Editor
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1">
                  Salin &amp; paste SQL berikut
                </div>
                <p className="text-muted-foreground text-xs mb-2">
                  File lengkap: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">scripts/supabase-schema.sql</code>
                </p>
                <Button
                  onClick={handleCopySQL}
                  variant="outline"
                  size="sm"
                  className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Salin SQL ke clipboard
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1">Klik &quot;Run&quot; di SQL Editor</div>
                <p className="text-muted-foreground text-xs">
                  Tunggu sampai semua statement selesai (~5 detik). Akan membuat 8 tabel, RLS policies, stored procedures, dan seed data (users Abi &amp; Umi, 32 kategori, 5 rekening contoh, 2 aset).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                4
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1">
                  Klik tombol di bawah untuk verifikasi
                </div>
                <p className="text-muted-foreground text-xs mb-2">
                  App akan cek koneksi dan langsung aktif jika tabel sudah ada.
                </p>
                <Button
                  onClick={handleRefresh}
                  disabled={status === "checking"}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {status === "checking" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mengecek...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Saya sudah run SQL, cek sekarang
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Info box */}
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs">
              <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                Yang akan dibuat:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>8 tabel: users, accounts, categories, transactions, budgets, assets, liabilities, settings</li>
                <li>RLS policies (permissive untuk anon key)</li>
                <li>2 stored procedures: <code>record_transaction</code> &amp; <code>delete_transaction</code> (atomic auto-update saldo)</li>
                <li>Realtime publication untuk live sync antar perangkat</li>
                <li>Seed: Abi &amp; Umi, 32 kategori Indonesia, 5 rekening, 2 aset</li>
              </ul>
            </div>

            {stats && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                <pre className="overflow-x-auto">{JSON.stringify(stats, null, 2)}</pre>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWizard(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
