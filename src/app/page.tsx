// Halaman utama aplikasi keuangan keluarga
// - Auth gate: pilih Abi/Umi jika belum login
// - Layout: header + (sidebar/desktop | bottom-nav/mobile) + content
// - 5 tab: Beranda, Transaksi, Anggaran, Aset, Laporan
// - Handle URL shortcut dari PWA manifest (/?action=expense/income/report)
//
// PENTING: useSearchParams dari next/navigation WAJIB dibungkus <Suspense>
// kalau tidak, Next.js gagal saat static prerender (error di Vercel build).
// Alternatif: export const dynamic = 'force-dynamic' (tapi lebih boros).
// Kami pakai Suspense + force-dynamic untuk belt-and-suspenders.
'use client';
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/session-store";
import { LoginScreen } from "@/components/auth/login-screen";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav, TabKey } from "@/components/layout/bottom-nav";
import { QuickTransactionForm } from "@/components/transactions/quick-form";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { AccountList } from "@/components/dashboard/account-list";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ExpenseDonutChart } from "@/components/dashboard/expense-chart";
import { DailyTrendChart } from "@/components/dashboard/daily-trend";
import { TransactionsPanel } from "@/components/transactions/transactions-panel";
import { BudgetPanel } from "@/components/budget/budget-panel";
import { AssetsPanel } from "@/components/assets/assets-panel";
import { ReportPanel } from "@/components/reports/report-panel";
import { useReport, useTransactions, useDeleteTransaction } from "@/hooks/use-data";

// Force dynamic render agar Next.js tidak coba static prerender halaman ini.
// Halaman pakai useSearchParams + akses localStorage (session) yang tidak
// bisa ditentukan saat build time.
export const dynamic = "force-dynamic";

// Fallback saat Suspense loading (saat initial render URL params)
function HomeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </div>
    </div>
  );
}

// Komponen default — bungkus HomeContent dalam Suspense karena ada useSearchParams
export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}

// Komponen utama yang pakai useSearchParams
function HomeContent() {
  const { user } = useSession();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [tab, setTab] = useState<TabKey>("home");
  const [quickOpen, setQuickOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<
    "INCOME" | "EXPENSE" | "TRANSFER"
  >("EXPENSE");
  // Counter untuk force-remount form tiap kali dibuka
  // agar state reset bersih (pola React yang direkomendasikan)
  const [formSession, setFormSession] = useState(0);
  const searchParams = useSearchParams();

  // Handle PWA shortcut dari manifest: ?action=expense/income/report
  // Sync URL param (external state) ke React state — satu kali per perubahan URL.
  useEffect(() => {
    if (!user) return;
    const action = searchParams.get("action");
    if (action === "expense") {
      setDefaultType("EXPENSE");
      setFormSession((n) => n + 1);
      setQuickOpen(true);
    } else if (action === "income") {
      setDefaultType("INCOME");
      setFormSession((n) => n + 1);
      setQuickOpen(true);
    } else if (action === "report") {
      setTab("report");
    }
  }, [user, searchParams]);

  // Jika belum login, tampilkan login screen
  if (!user) return <LoginScreen />;

  const openQuickAdd = (type?: "INCOME" | "EXPENSE" | "TRANSFER") => {
    setDefaultType(type ?? "EXPENSE");
    setFormSession((n) => n + 1);
    setQuickOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader
        month={month}
        year={year}
        onChangePeriod={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
      />

      <div className="flex flex-1 mx-auto w-full max-w-5xl">
        <BottomNav
          active={tab}
          onChange={setTab}
          onQuickAdd={() => openQuickAdd()}
        />
        <main className="flex-1 min-w-0 p-4 pb-24 md:pb-8 space-y-4">
          {tab === "home" && (
            <HomeTab
              month={month}
              year={year}
              onSeeAllTransactions={() => setTab("transactions")}
              onQuickAdd={openQuickAdd}
              onAddAccount={() => setTab("assets")}
            />
          )}
          {tab === "transactions" && (
            <TransactionsPanel
              month={month}
              year={year}
              onQuickAdd={() => openQuickAdd()}
            />
          )}
          {tab === "budget" && (
            <BudgetPanel month={month} year={year} />
          )}
          {tab === "assets" && <AssetsPanel />}
          {tab === "report" && (
            <ReportPanel month={month} year={year} />
          )}
        </main>
      </div>

      <QuickTransactionForm
        key={formSession}
        open={quickOpen}
        onOpenChange={setQuickOpen}
        defaultType={defaultType}
      />
    </div>
  );
}

function HomeTab({
  month,
  year,
  onSeeAllTransactions,
  onQuickAdd,
  onAddAccount,
}: {
  month: number;
  year: number;
  onSeeAllTransactions: () => void;
  onQuickAdd: (type?: "INCOME" | "EXPENSE" | "TRANSFER") => void;
  onAddAccount: () => void;
}) {
  const { data: report, isLoading } = useReport(month, year);
  const { data: txs } = useTransactions({ month, year, limit: 8 });
  const del = useDeleteTransaction();

  return (
    <>
      {/* Quick actions */}
      <div className="rounded-xl bg-card border border-emerald-100 dark:border-emerald-900/30 p-3">
        <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">
          Catat Cepat
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Pemasukan", type: "INCOME" as const, icon: "↘", color: "emerald" },
            { label: "Pengeluaran", type: "EXPENSE" as const, icon: "↗", color: "rose" },
            { label: "Transfer", type: "TRANSFER" as const, icon: "⇄", color: "amber" },
          ].map((q) => (
            <button
              key={q.label}
              onClick={() => onQuickAdd(q.type)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors ${
                q.color === "emerald"
                  ? "text-emerald-700 dark:text-emerald-300"
                  : q.color === "rose"
                  ? "text-rose-700 dark:text-rose-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              <span className="text-2xl">{q.icon}</span>
              <span className="text-[10px] font-medium text-center leading-tight">
                {q.label}
              </span>
            </button>
          ))}
          <button
            onClick={onSeeAllTransactions}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors text-slate-700 dark:text-slate-300"
          >
            <span className="text-2xl">📋</span>
            <span className="text-[10px] font-medium text-center leading-tight">
              Riwayat
            </span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards report={report} />

      {/* Two-column layout on desktop */}
      <div className="grid lg:grid-cols-2 gap-4">
        <ExpenseDonutChart
          breakdown={report?.breakdown}
          isLoading={isLoading}
          total={report?.summary?.expense ?? 0}
        />
        <AccountList
          accounts={report?.accounts}
          isLoading={isLoading}
          onAdd={onAddAccount}
        />
      </div>

      {/* Daily trend - full width */}
      <DailyTrendChart
        daily={report?.daily}
        isLoading={isLoading}
      />

      {/* Recent transactions */}
      <RecentTransactions
        transactions={txs}
        isLoading={!txs}
        onDelete={(id) => del.mutate(id)}
        onSeeAll={onSeeAllTransactions}
      />
    </>
  );
}
