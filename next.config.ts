import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Catatan: output "standalone" dihapus karena deployment target Vercel
  // (Vercel handle deployment otomatis tanpa perlu standalone output).
  // Untuk self-hosted (Docker/VPS), tambahkan kembali: output: "standalone"
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Headers untuk service worker & PWA
  async headers() {
    return [
      {
        // Service worker harus tidak di-cache oleh browser
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Manifest juga harus selalu segar
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "no-cache, must-revalidate" },
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
      {
        // Ikon boleh di-cache lama
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
