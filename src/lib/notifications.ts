// Utilitas Browser Notification API
// Sumber: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
'use client';

import { toast } from "sonner";

export type NotificationPermission = "default" | "granted" | "denied" | "unsupported";

// Cek apakah browser support Notification API
export function isNotificationsSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window;
}

// Ambil status permission saat ini
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationsSupported()) return "unsupported" as any;
  return Notification.permission;
}

// Minta izin notifikasi ke user
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationsSupported()) {
    return "unsupported" as any;
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (e) {
    console.warn("[Notif] Gagal request permission:", e);
    return "denied";
  }
}

// Tampilkan notifikasi browser
// Fallback ke toast (sonner) jika permission belum granted atau tidak support
export function showNotification(
  title: string,
  options?: NotificationOptions & { fallbackToast?: boolean }
): void {
  const { fallbackToast = true, ...notifOpts } = options ?? {};

  // Coba browser notification dulu kalau permission granted
  if (isNotificationsSupported() && Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        icon: "/icons/icon-192.png",
        badge: "/icons/favicon-32.png",
        tag: notifOpts.tag,
        body: notifOpts.body,
        data: notifOpts.data,
        requireInteraction: notifOpts.requireInteraction ?? false,
      });

      // Tutup otomatis setelah 8 detik (kecuali requireInteraction)
      if (!notifOpts.requireInteraction) {
        setTimeout(() => notif.close(), 8000);
      }

      // Click → buka app & fokus
      notif.onclick = () => {
        window.focus();
        notif.close();
        if (notifOpts.data?.url) {
          window.location.href = notifOpts.data.url;
        }
      };

      return;
    } catch (e) {
      console.warn("[Notif] Gagal tampilkan notification:", e);
    }
  }

  // Fallback: pakai toast sonner
  if (fallbackToast) {
    toast(title, {
      description: notifOpts.body,
      duration: 6000,
    });
  }
}

// Local storage key untuk preference user (in-app toggle)
const NOTIF_ENABLED_KEY = "keuangan-notif-enabled";

export function isNotifEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(NOTIF_ENABLED_KEY) !== "false"; // default true
}

export function setNotifEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIF_ENABLED_KEY, String(enabled));
}

// Helper: cek apakah notif bisa ditampilkan (support + granted + enabled oleh user)
export function canShowNotification(): boolean {
  return (
    isNotifEnabled() &&
    isNotificationsSupported() &&
    Notification.permission === "granted"
  );
}
