// Halaman login: pilih siapa yang sedang mencatat (Abi atau Umi)
'use client';
import { useState } from "react";
import { useUsers, useSeed } from "@/hooks/use-data";
import { useSession } from "@/lib/session-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, UserPlus, Sparkles } from "lucide-react";
import { colorClass } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export function LoginScreen() {
  const { data: users, isLoading } = useUsers();
  const { setUser } = useSession();
  const seedMutation = useSeed();
  const [showSeedBtn, setShowSeedBtn] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-amber-50 dark:from-emerald-950/30 dark:via-background dark:to-amber-950/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Keuangan Keluarga
            </h1>
            <p className="text-sm text-muted-foreground">
              Abi &amp; Umi — catatan keuangan bersama
            </p>
          </div>
        </div>

        <Card className="border-emerald-200/50 dark:border-emerald-800/50">
          <CardHeader>
            <CardTitle className="text-center text-base flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              Siapa yang mencatat?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : (
              users?.map((u: any) => {
                const cls = colorClass(u.color);
                return (
                  <button
                    key={u.id}
                    onClick={() => setUser(u)}
                    className={`w-full p-5 rounded-xl border-2 border-transparent ${cls.bg} hover:border-emerald-400 transition-all active:scale-[0.98] flex items-center gap-4 text-left`}
                  >
                    <div
                      className={`w-14 h-14 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-2xl font-bold ${cls.text}`}
                    >
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-lg ${cls.text}`}>
                        {u.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ketuk untuk masuk
                      </div>
                    </div>
                  </button>
                );
              })
            )}

            {users && users.length === 0 && !isLoading && (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Belum ada pengguna. Muat data awal dulu.
                </p>
                <Button
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Muat Data Awal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tombol sembunyi untuk muat ulang data awal */}
        <div className="text-center">
          {showSeedBtn ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Muat ulang data awal (jika kosong)
            </Button>
          ) : (
            <button
              onClick={() => setShowSeedBtn(true)}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground"
            >
              ⋯
            </button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground/70 px-6">
          Catatan: aplikasi ini khusus untuk keluarga. Data tersinkron otomatis antar perangkat saat dibuka di browser yang sama.
        </p>
      </div>
    </div>
  );
}
