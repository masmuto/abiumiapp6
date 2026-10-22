// Dialog pengaturan Notifikasi
// Akses dari menu user dropdown → "Pengaturan Notifikasi"
'use client';
import { useState, useEffect } from "react";
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
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Send,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  isNotifEnabled,
  setNotifEnabled,
  type NotificationPermission,
} from "@/lib/notifications";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function NotificationsDialog({ open, onOpenChange }: Props) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(true);
  const [requesting, setRequesting] = useState(false);

  // Sync state on mount + when dialog opens
  useEffect(() => {
    if (!open) return;
    setSupported(isNotificationsSupported());
    setPermission(getNotificationPermission());
    setEnabled(isNotifEnabled());
  }, [open]);

  // === Handle toggle enable/disable ===
  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    setNotifEnabled(checked);
    if (checked) {
      toast.success("Notifikasi diaktifkan");
    } else {
      toast.info("Notifikasi dinonaktifkan");
    }
  };

  // === Handle request permission ===
  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === "granted") {
        toast.success("Izin notifikasi diberikan!");
        // Kirim test notification
        setTimeout(() => {
          showNotification("Notifikasi Aktif!", {
            body: "Anda akan mendapat notifikasi saat Abi atau Umi mencatat transaksi baru.",
            tag: "test-notif",
            fallbackToast: false,
          });
        }, 500);
      } else if (result === "denied") {
        toast.error("Izin notifikasi ditolak. Buka pengaturan browser untuk mengizinkan.");
      }
    } finally {
      setRequesting(false);
    }
  };

  // === Test notification ===
  const handleTestNotification = () => {
    if (permission !== "granted") {
      toast.error("Izin notifikasi belum diberikan");
      return;
    }
    if (!enabled) {
      toast.error("Notifikasi sedang dinonaktifkan di pengaturan");
      return;
    }
    showNotification("🔔 Test Notifikasi", {
      body: "Ini contoh notifikasi yang akan muncul saat ada transaksi baru dari Abi atau Umi.",
      tag: "test-notif",
      fallbackToast: true,
    });
  };

  // Render status badge
  const renderStatus = () => {
    if (!supported) {
      return (
        <div className="flex items-center gap-2 text-xs text-rose-600">
          <XCircle className="w-4 h-4" />
          Browser tidak mendukung notifikasi
        </div>
      );
    }
    if (permission === "granted") {
      return (
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          Diizinkan
        </div>
      );
    }
    if (permission === "denied") {
      return (
        <div className="flex items-center gap-2 text-xs text-rose-600">
          <XCircle className="w-4 h-4" />
          Diblokir di browser
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600">
        <AlertTriangle className="w-4 h-4" />
        Belum ditanya
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            Pengaturan Notifikasi
          </DialogTitle>
          <DialogDescription>
            Dapatkan notifikasi saat Abi atau Umi mencatat transaksi baru.
            Notifikasi muncul di perangkat yang sedang aktif (browser/app).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* === Status permission === */}
          <Card className="bg-muted/50 border-0">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">Status Izin Browser</div>
                  <div className="text-xs text-muted-foreground">
                    Permission untuk tampilkan notifikasi system
                  </div>
                </div>
                {renderStatus()}
              </div>

              {/* Tombol request permission */}
              {permission !== "granted" && permission !== "unsupported" && (
                <Button
                  onClick={handleRequestPermission}
                  disabled={requesting || permission === "denied"}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                >
                  {requesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Meminta izin...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-1" />
                      Minta Izin Notifikasi
                    </>
                  )}
                </Button>
              )}

              {/* Hint kalau denied */}
              {permission === "denied" && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-2.5 text-xs space-y-1">
                  <div className="font-semibold text-amber-700 dark:text-amber-300">
                    Cara mengizinkan ulang:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>
                      <strong>Chrome:</strong> Klik ikon 🔒 di address bar →
                      Notifikasi → Izinkan
                    </li>
                    <li>
                      <strong>Safari:</strong> Preferences → Websites →
                      Notifications → Allow
                    </li>
                    <li>
                      <strong>HP Android:</strong> Settings app → App →
                      Browser → Notifications
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* === In-app toggle === */}
          <Card>
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {enabled ? (
                  <Bell className="w-5 h-5 text-emerald-600 mt-0.5" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground mt-0.5" />
                )}
                <div className="flex-1">
                  <Label
                    htmlFor="notif-toggle"
                    className="font-semibold text-sm cursor-pointer"
                  >
                    Notifikasi Transaksi
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Aktifkan untuk dapat notif saat ada transaksi baru dicatat
                    Abi atau Umi di perangkat lain.
                  </p>
                </div>
              </div>
              <Switch
                id="notif-toggle"
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={!supported || permission !== "granted"}
              />
            </CardContent>
          </Card>

          {/* === Test notification === */}
          <Button
            onClick={handleTestNotification}
            disabled={
              !supported ||
              permission !== "granted" ||
              !enabled
            }
            variant="outline"
            className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            size="sm"
          >
            <Send className="w-4 h-4 mr-1" />
            Kirim Test Notifikasi
          </Button>

          {/* === Info: trigger notifikasi === */}
          <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50">
            <CardContent className="p-3 space-y-2">
              <div className="font-semibold text-xs text-emerald-700 dark:text-emerald-300">
                Kapan notifikasi muncul?
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>
                    Saat Abi/Umi catat transaksi baru di perangkat lain (PWA
                    ter-install di HP)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Saat app sedang buka di tab lain (live sync)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/60">×</span>
                  <span className="text-muted-foreground/70 line-through">
                    (Segera) Pengingat catat transaksi harian
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground/60">×</span>
                  <span className="text-muted-foreground/70 line-through">
                    (Segera) Pengingat jatuh tempo utang
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* === Cara pakai === */}
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <div className="font-semibold mb-1">💡 Catatan:</div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>
                Notifikasi muncul di perangkat yang sedang buka app (tab aktif
                atau PWA ter-install)
              </li>
              <li>
                Untuk notifikasi push saat app tertutup, perlu setup Web Push
                API dengan VAPID keys (segera)
              </li>
              <li>
                Tidak dapat notif dari transaksi yang Anda sendiri catat (biar
                tidak mengganggu)
              </li>
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
