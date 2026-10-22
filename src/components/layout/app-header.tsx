// Header: logo + nama pengguna aktif + tombol ganti user + install PWA
'use client';
import { useSession } from "@/lib/session-store";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, ChevronDown, Download, CheckCircle2, Share, Database, Tag, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { colorClass } from "@/lib/format";
import { MONTHS_ID } from "@/lib/constants";
import { usePWAInstall } from "@/components/pwa/pwa-provider";
import { BackupDialog } from "@/components/settings/backup-dialog";
import { CategoriesDialog } from "@/components/categories/categories-panel";
import { NotificationsDialog } from "@/components/notifications/notifications-dialog";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function AppHeader({
  month,
  year,
  onChangePeriod,
}: {
  month: number;
  year: number;
  onChangePeriod?: (m: number, y: number) => void;
}) {
  const { user, logout } = useSession();
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-emerald-100 dark:border-emerald-900/30">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm truncate">Keuangan Keluarga</div>
              <div className="text-xs text-muted-foreground truncate">
                {MONTHS_ID[month - 1]} {year}
              </div>
            </div>
          </div>

          {/* User chip */}
          {user && (
            <div className="flex items-center gap-2">
              {/* Pilih bulan (desktop) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    {MONTHS_ID[month - 1].slice(0, 3)} {year}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Pilih Bulan</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {MONTHS_ID.map((m, i) => (
                    <DropdownMenuItem
                      key={m}
                      onClick={() => onChangePeriod?.(i + 1, year)}
                    >
                      {m}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Tahun</DropdownMenuLabel>
                  {[-1, 0, 1].map((offset) => {
                    const y = new Date().getFullYear() + offset;
                    return (
                      <DropdownMenuItem
                        key={y}
                        onClick={() => onChangePeriod?.(month, y)}
                      >
                        {y}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User info */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 pl-1 pr-2"
                  >
                    <span
                      className={`w-7 h-7 rounded-full ${colorClass(user.color).bg} flex items-center justify-center text-xs font-bold ${colorClass(user.color).text}`}
                    >
                      {user.name.charAt(0)}
                    </span>
                    <span className="hidden sm:inline">{user.name}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    Sedang mencatat sebagai
                  </DropdownMenuLabel>
                  <DropdownMenuItem className="font-bold">
                    {user.name}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Install / installed status */}
                  {isInstalled ? (
                    <DropdownMenuItem disabled className="text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aplikasi terpasang
                    </DropdownMenuItem>
                  ) : canInstall ? (
                    <DropdownMenuItem onClick={() => promptInstall()}>
                      <Download className="w-4 h-4 mr-2" />
                      Pasang Aplikasi
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setShowIosHelp(true)}>
                      <Download className="w-4 h-4 mr-2" />
                      Cara Pasang Aplikasi
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setShowIosHelp(true)}>
                    <Share className="w-4 h-4 mr-2" />
                    Panduan Pasang (HP)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowCategories(true)}>
                    <Tag className="w-4 h-4 mr-2" />
                    Kelola Kategori
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowNotif(true)}>
                    <Bell className="w-4 h-4 mr-2" />
                    Pengaturan Notifikasi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowBackup(true)}>
                    <Database className="w-4 h-4 mr-2" />
                    Cadangkan Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Ganti pengguna
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      {/* Dialog panduan install untuk iOS / browser lain */}
      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600" />
              Cara Pasang Aplikasi
            </DialogTitle>
            <DialogDescription>
              Pasang aplikasi ke layar utama HP agar bisa dibuka cepat &amp;
              bekerja offline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-semibold mb-1 flex items-center gap-2">
                📱 Di iPhone / iPad (Safari)
              </div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Buka aplikasi via <span className="font-medium">Safari</span>{" "}
                  (Chrome di iOS tidak mendukung).
                </li>
                <li>
                  Tekan tombol <Share className="w-3 h-3 inline" /> Share di
                  bawah.
                </li>
                <li>
                  Pilih <span className="font-medium">&quot;Tambah ke Layar Utama&quot;</span>.
                </li>
                <li>
                  Tekan <span className="font-medium">&quot;Tambah&quot;</span>.
                </li>
              </ol>
            </div>
            <div>
              <div className="font-semibold mb-1">🤖 Di Android (Chrome)</div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Buka aplikasi di <span className="font-medium">Chrome</span>.
                </li>
                <li>
                  Tekan menu <span className="font-medium">⋮</span> di kanan
                  atas.
                </li>
                <li>
                  Pilih <span className="font-medium">&quot;Tambahkan ke layar utama&quot;</span>.
                </li>
                <li>
                  Tekan <span className="font-medium">&quot;Pasang&quot;</span>.
                </li>
              </ol>
            </div>
            <div>
              <div className="font-semibold mb-1">💻 Di Komputer (Chrome/Edge)</div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Cari ikon <span className="font-medium">⊕</span> di kanan
                  address bar.
                </li>
                <li>
                  Tekan &amp; pilih{" "}
                  <span className="font-medium">&quot;Pasang&quot;</span>.
                </li>
              </ol>
            </div>
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs">
              <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                Keuntungan pasang aplikasi:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                <li>Buka cepat dari layar utama (1 ketukan)</li>
                <li>Bekerja offline (data tersimpan lokal)</li>
                <li>Tampil fullscreen tanpa address bar</li>
                <li>Notifikasi pengingat (segera)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowIosHelp(false)} className="bg-emerald-600 hover:bg-emerald-700">
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog backup & restore data */}
      <BackupDialog open={showBackup} onOpenChange={setShowBackup} />

      {/* Dialog kelola kategori (tambah/edit/hapus) */}
      <CategoriesDialog open={showCategories} onOpenChange={setShowCategories} />

      {/* Dialog pengaturan notifikasi */}
      <NotificationsDialog open={showNotif} onOpenChange={setShowNotif} />
    </>
  );
}
