// Bottom navigation untuk mobile + sidebar untuk desktop
'use client';
import { Home, Receipt, PiggyBank, Layers, FileBarChart, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type TabKey = "home" | "transactions" | "budget" | "assets" | "report";

const NAV: { key: TabKey; label: string; icon: any }[] = [
  { key: "home", label: "Beranda", icon: Home },
  { key: "transactions", label: "Transaksi", icon: Receipt },
  { key: "budget", label: "Anggaran", icon: PiggyBank },
  { key: "assets", label: "Aset", icon: Layers },
  { key: "report", label: "Laporan", icon: FileBarChart },
];

export function BottomNav({
  active,
  onChange,
  onQuickAdd,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
  onQuickAdd: () => void;
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-emerald-100 dark:border-emerald-900/30 p-3 gap-1 sticky top-[57px] h-[calc(100vh-57px)]">
        {NAV.map((n) => {
          const Icon = n.icon;
          const isActive = active === n.key;
          return (
            <button
              key={n.key}
              onClick={() => onChange(n.key)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              )}
            >
              <Icon className="w-4 h-4" />
              {n.label}
            </button>
          );
        })}
        <Button
          onClick={onQuickAdd}
          className="mt-4 bg-emerald-600 hover:bg-emerald-700 w-full shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4 mr-1" />
          Catat Cepat
        </Button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur border-t border-emerald-100 dark:border-emerald-900/30">
        <div className="grid grid-cols-5 gap-1 p-1 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((n) => {
            const Icon = n.icon;
            const isActive = active === n.key;
            return (
              <button
                key={n.key}
                onClick={() => onChange(n.key)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium transition-all min-h-[44px]",
                  isActive
                    ? "text-emerald-600"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{n.label}</span>
              </button>
            );
          })}
        </div>
        {/* Floating quick add button */}
        <Button
          onClick={onQuickAdd}
          size="icon"
          className="absolute -top-7 right-4 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/40 border-4 border-background"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </nav>
    </>
  );
}
