// Komponen PWA: registrasi service worker + deteksi offline + install prompt
// + global realtime sync Supabase (live update antar perangkat)
'use client';
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  WifiOff,
  X,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { useGlobalRealtimeSync } from "@/hooks/use-realtime";
import { useTransactionNotifications } from "@/hooks/use-notifications";

// Type untuk beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_DISMISSED_KEY = "pwa-install-dismissed";

// Helper: cek apakah aplikasi sudah ter-install (standalone mode)
function checkIsInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export function PWAProvider() {
  // Lazy initializer: cek installed status saat first render, no effect needed
  const [isInstalled, setIsInstalled] = useState<boolean>(checkIsInstalled);
  const [isOffline, setIsOffline] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);

  // === Realtime sync Supabase: live update antar perangkat ===
  // Saat Abi catat di HP-nya, Umi yang buka app di HP lain langsung lihat
  useGlobalRealtimeSync();

  // === Notifikasi transaksi: show browser notif saat ada tx baru dari user lain ===
  // Abi catat di HP-nya → Umi yang buka app di HP lain akan dapat notif
  useTransactionNotifications();

  // === Register service worker ===
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Register SW
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[PWA] Service worker registered:", reg.scope);
        setSwReg(reg);

        // Cek update
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("[PWA] Update tersedia");
              setHasUpdate(true);
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[PWA] SW registration failed:", err);
      });

    // Listen update SW
    const controllerChangeHandler = () => {
      console.log("[PWA] Controller changed - reloading");
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", controllerChangeHandler);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", controllerChangeHandler);
    };
  }, []);

  // === Deteksi online/offline ===
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOffline(!online);
      setShowOfflineBanner(!online);
    };

    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // === Install prompt ===
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      setInstallEvent(evt);

      // Hanya tampilkan kalau user belum dismiss & belum installed
      const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
      if (dismissed !== "true" && !checkIsInstalled()) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      console.log("[PWA] App installed");
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setInstallEvent(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  // === Handle install button click ===
  const handleInstall = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        console.log("[PWA] User accepted install");
        setIsInstalled(true);
      } else {
        console.log("[PWA] User dismissed install");
      }
      setInstallEvent(null);
      setShowInstallPrompt(false);
    } catch (err) {
      console.warn("[PWA] Install failed:", err);
    }
  };

  // === Handle dismiss install prompt ===
  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
  };

  // === Apply update ===
  const handleUpdate = () => {
    if (swReg && swReg.waiting) {
      swReg.waiting.postMessage("SKIP_WAITING");
    }
  };

  return (
    <>
      {/* Offline banner */}
      {showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top">
          <WifiOff className="w-4 h-4" />
          <span>Anda sedang offline. Beberapa data mungkin tidak terbarui.</span>
          <button
            onClick={() => setShowOfflineBanner(false)}
            className="ml-2 opacity-80 hover:opacity-100"
            aria-label="Tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Install prompt */}
      {showInstallPrompt && installEvent && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom">
          <Card className="border-emerald-300 shadow-xl shadow-emerald-900/10 bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950/40 dark:to-amber-950/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">
                    Pasang aplikasi di perangkat?
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Buka cepat dari layar utama, bekerja offline. Abi &amp; Umi
                    bisa catat kapan saja.
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Pasang
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                  className="border-emerald-300"
                >
                  Nanti saja
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update available banner */}
      {hasUpdate && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
          <Card className="border-emerald-300 shadow-lg bg-emerald-50 dark:bg-emerald-950/40">
            <CardContent className="p-3 flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 text-xs">
                <div className="font-semibold">Versi baru tersedia</div>
                <div className="text-muted-foreground">
                  Muat ulang untuk memperbarui aplikasi.
                </div>
              </div>
              <Button
                onClick={handleUpdate}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 h-7"
              >
                Update
              </Button>
              <button
                onClick={() => setHasUpdate(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// === Hook untuk install manual (dipakai di tombol "Install Aplikasi") ===
export function usePWAInstall() {
  // Lazy initializer untuk installed status
  const [isInstalled, setIsInstalled] = useState<boolean>(checkIsInstalled);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Sudah ter-install? Tidak perlu dengarkan event.
    if (checkIsInstalled()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallEvent(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const promptInstall = async () => {
    if (!installEvent) return false;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      setInstallEvent(null);
      setCanInstall(false);
      return choice.outcome === "accepted";
    } catch {
      return false;
    }
  };

  return { canInstall, isInstalled, promptInstall };
}
