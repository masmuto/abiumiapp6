// Store Zustand untuk sesi pengguna aktif (Abi atau Umi)
// Disimpan di localStorage agar tetap setelah refresh
'use client';
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CurrentUser = {
  id: string;
  name: string;
  role: string;
  color: string;
};

type SessionState = {
  user: CurrentUser | null;
  setUser: (u: CurrentUser | null) => void;
  logout: () => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      logout: () => set({ user: null }),
    }),
    { name: "keuangan-session" }
  )
);
