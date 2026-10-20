-- ============================================================================
-- SKEMA DATABASE SUPABASE - APLIKASI KEUANGAN KELUARGA (ABI & UMI)
-- ============================================================================
-- Cara pakai:
--   1. Buka Supabase Dashboard → SQL Editor
--   2. Salin seluruh isi file ini
--   3. Klik "Run" untuk eksekusi
--   4. Setelah selesai, kembali ke aplikasi — semua tabel & seed siap dipakai
-- ============================================================================

-- Extension untuk UUID generation (aktif default di Supabase)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABEL USERS (Abi & Umi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'PARENT',
  pin         TEXT,
  color       TEXT NOT NULL DEFAULT 'emerald',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. TABEL ACCOUNTS (Rekening)
-- ============================================================================
CREATE TABLE IF NOT EXISTS accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL, -- CASH / BANK / EWALLET / SAVINGS / GOLD / OTHER
  initial_balance INTEGER NOT NULL DEFAULT 0, -- saldo awal dalam Rupiah
  balance         INTEGER NOT NULL DEFAULT 0, -- saldo berjalan (auto-update)
  icon            TEXT,
  archived        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_accounts_archived ON accounts(archived);

-- ============================================================================
-- 3. TABEL CATEGORIES (Kategori transaksi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL, -- INCOME / EXPENSE
  icon        TEXT,
  color       TEXT NOT NULL DEFAULT 'emerald',
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, type)
);

-- ============================================================================
-- 4. TABEL TRANSACTIONS (Transaksi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date          TIMESTAMPTZ NOT NULL,
  type          TEXT NOT NULL, -- INCOME / EXPENSE / TRANSFER
  amount        INTEGER NOT NULL CHECK (amount > 0),
  note          TEXT,
  user_id       UUID REFERENCES users(id),
  account_id    UUID REFERENCES accounts(id),
  category_id   UUID REFERENCES categories(id),
  to_account_id UUID REFERENCES accounts(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_tx_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_account_id ON transactions(account_id);

-- ============================================================================
-- 5. TABEL BUDGETS (Anggaran bulanan per kategori)
-- ============================================================================
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INTEGER NOT NULL,
  amount      INTEGER NOT NULL,
  spent       INTEGER NOT NULL DEFAULT 0,
  category_id UUID NOT NULL REFERENCES categories(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(month, year, category_id)
);

-- ============================================================================
-- 6. TABEL ASSETS (Aset: emas, dinar, dll)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL, -- GOLD / DINAR / CASH / INVESTMENT / OTHER
  quantity    REAL NOT NULL DEFAULT 1,
  unit_price  INTEGER NOT NULL DEFAULT 0,
  value       INTEGER NOT NULL DEFAULT 0,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. TABEL LIABILITIES (Kewajiban / Utang)
-- ============================================================================
CREATE TABLE IF NOT EXISTS liabilities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  amount     INTEGER NOT NULL,
  due_date   TIMESTAMPTZ,
  note       TEXT,
  settled    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. TABEL SETTINGS (Pengaturan global)
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  id    TEXT PRIMARY KEY,
  value TEXT
);

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Aplikasi keluarga: permissive (siapa pun dengan anon key bisa akses).
-- Untuk produksi yang lebih aman, ganti policy menjadi "auth.uid() IS NOT NULL".

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop policies yang ada (jika re-run)
DROP POLICY IF EXISTS "allow_all_users" ON users;
DROP POLICY IF EXISTS "allow_all_accounts" ON accounts;
DROP POLICY IF EXISTS "allow_all_categories" ON categories;
DROP POLICY IF EXISTS "allow_all_transactions" ON transactions;
DROP POLICY IF EXISTS "allow_all_budgets" ON budgets;
DROP POLICY IF EXISTS "allow_all_assets" ON assets;
DROP POLICY IF EXISTS "allow_all_liabilities" ON liabilities;
DROP POLICY IF EXISTS "allow_all_settings" ON settings;

-- Create permissive policies
CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_budgets" ON budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_liabilities" ON liabilities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 10. REALTIME PUBLICATION (untuk live sync antar perangkat)
-- ============================================================================
-- Supabase Realtime: perubahan data langsung di-push ke semua client.
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE assets;
ALTER PUBLICATION supabase_realtime ADD TABLE liabilities;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;

-- ============================================================================
-- 11. STORED PROCEDURES (untuk auto-update saldo secara atomik)
-- ============================================================================

-- Fungsi: catat transaksi + auto-update saldo dalam satu transaksi DB
CREATE OR REPLACE FUNCTION record_transaction(
  p_date TIMESTAMPTZ,
  p_type TEXT,
  p_amount INTEGER,
  p_note TEXT,
  p_user_id UUID,
  p_account_id UUID,
  p_category_id UUID,
  p_to_account_id UUID
) RETURNS UUID AS $$
DECLARE
  tx_id UUID;
  tx_month INTEGER;
  tx_year INTEGER;
BEGIN
  -- Insert transaksi
  INSERT INTO transactions (date, type, amount, note, user_id, account_id, category_id, to_account_id)
  VALUES (p_date, p_type, p_amount, p_note, p_user_id, p_account_id, p_category_id, p_to_account_id)
  RETURNING id INTO tx_id;

  tx_month := EXTRACT(MONTH FROM p_date)::INTEGER;
  tx_year := EXTRACT(YEAR FROM p_date)::INTEGER;

  -- Update saldo rekening
  IF p_type = 'INCOME' THEN
    UPDATE accounts SET balance = balance + p_amount, updated_at = now() WHERE id = p_account_id;
  ELSIF p_type = 'EXPENSE' THEN
    UPDATE accounts SET balance = balance - p_amount, updated_at = now() WHERE id = p_account_id;
    -- Update budget spent (jika ada anggaran untuk kategori + bulan ini)
    IF p_category_id IS NOT NULL THEN
      UPDATE budgets
        SET spent = spent + p_amount, updated_at = now()
        WHERE category_id = p_category_id AND month = tx_month AND year = tx_year;
    END IF;
  ELSIF p_type = 'TRANSFER' THEN
    UPDATE accounts SET balance = balance - p_amount, updated_at = now() WHERE id = p_account_id;
    UPDATE accounts SET balance = balance + p_amount, updated_at = now() WHERE id = p_to_account_id;
  END IF;

  RETURN tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi: hapus transaksi + reverse saldo
CREATE OR REPLACE FUNCTION delete_transaction(p_tx_id UUID) RETURNS VOID AS $$
DECLARE
  v_tx RECORD;
  tx_month INTEGER;
  tx_year INTEGER;
BEGIN
  SELECT * INTO v_tx FROM transactions WHERE id = p_tx_id;
  IF NOT FOUND THEN RETURN; END IF;

  tx_month := EXTRACT(MONTH FROM v_tx.date)::INTEGER;
  tx_year := EXTRACT(YEAR FROM v_tx.date)::INTEGER;

  -- Reverse saldo
  IF v_tx.type = 'INCOME' THEN
    UPDATE accounts SET balance = balance - v_tx.amount, updated_at = now() WHERE id = v_tx.account_id;
  ELSIF v_tx.type = 'EXPENSE' THEN
    UPDATE accounts SET balance = balance + v_tx.amount, updated_at = now() WHERE id = v_tx.account_id;
    IF v_tx.category_id IS NOT NULL THEN
      UPDATE budgets
        SET spent = spent - v_tx.amount, updated_at = now()
        WHERE category_id = v_tx.category_id AND month = tx_month AND year = tx_year;
    END IF;
  ELSIF v_tx.type = 'TRANSFER' AND v_tx.to_account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + v_tx.amount, updated_at = now() WHERE id = v_tx.account_id;
    UPDATE accounts SET balance = balance - v_tx.amount, updated_at = now() WHERE id = v_tx.to_account_id;
  END IF;

  DELETE FROM transactions WHERE id = p_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. SEED DATA AWAL
-- ============================================================================

-- Users: Abi & Umi
INSERT INTO users (name, role, color) VALUES
  ('Abi', 'PARENT', 'emerald'),
  ('Umi', 'PARENT', 'rose')
ON CONFLICT (name) DO NOTHING;

-- Categories default (32 kategori Indonesia)
INSERT INTO categories (name, type, icon, color, is_default) VALUES
  -- Pemasukan
  ('Gaji', 'INCOME', '💰', 'emerald', true),
  ('Bonus', 'INCOME', '🎁', 'emerald', true),
  ('THR', 'INCOME', '🕌', 'emerald', true),
  ('Hasil Jualan', 'INCOME', '🛒', 'emerald', true),
  ('Hadiah', 'INCOME', '🎀', 'emerald', true),
  ('Bantuan', 'INCOME', '🤝', 'emerald', true),
  ('Bagi Hasil', 'INCOME', '📊', 'emerald', true),
  ('Lain-lain (Masuk)', 'INCOME', '📥', 'emerald', true),
  -- Pengeluaran - kebutuhan pokok
  ('SPP Anak', 'EXPENSE', '🎓', 'rose', true),
  ('Uang Saku', 'EXPENSE', '👛', 'rose', true),
  ('Makan', 'EXPENSE', '🍱', 'rose', true),
  ('Belanja Bulanan', 'EXPENSE', '🛍', 'rose', true),
  ('Listrik', 'EXPENSE', '💡', 'rose', true),
  ('Air', 'EXPENSE', '🚰', 'rose', true),
  ('Kontrak Rumah', 'EXPENSE', '🏠', 'rose', true),
  ('Telepon & Internet', 'EXPENSE', '📶', 'rose', true),
  ('BBM', 'EXPENSE', '⛽', 'rose', true),
  ('Transportasi', 'EXPENSE', '🚗', 'rose', true),
  -- Pengeluaran - kesehatan & pendidikan
  ('Kesehatan', 'EXPENSE', '🏥', 'rose', true),
  ('Obat', 'EXPENSE', '💊', 'rose', true),
  ('Buku & ATK', 'EXPENSE', '📚', 'rose', true),
  ('Les Anak', 'EXPENSE', '✏', 'rose', true),
  -- Pengeluaran - sosial & ibadah
  ('Sedekah', 'EXPENSE', '🤲', 'rose', true),
  ('Infak', 'EXPENSE', '🕌', 'rose', true),
  ('Zakat', 'EXPENSE', '🌟', 'rose', true),
  ('Hadiah Keluar', 'EXPENSE', '🎁', 'rose', true),
  -- Pengeluaran - tabungan & investasi
  ('Tabungan', 'EXPENSE', '🐷', 'amber', true),
  ('Belanja Emas', 'EXPENSE', '🪙', 'amber', true),
  ('Investasi', 'EXPENSE', '📈', 'amber', true),
  -- Pengeluaran - hiburan
  ('Jalan-jalan', 'EXPENSE', '🏞', 'rose', true),
  ('Hiburan', 'EXPENSE', '🎮', 'rose', true),
  ('Lain-lain (Keluar)', 'EXPENSE', '📤', 'rose', true)
ON CONFLICT (name, type) DO NOTHING;

-- Rekening contoh (hanya jika belum ada)
INSERT INTO accounts (name, type, initial_balance, balance, icon)
SELECT 'Tunai Dompet', 'CASH', 500000, 500000, '💵'
WHERE NOT EXISTS (SELECT 1 FROM accounts LIMIT 1);

INSERT INTO accounts (name, type, initial_balance, balance, icon)
SELECT 'Bank BCA', 'BANK', 5000000, 5000000, '🏦'
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE name = 'Bank BCA');

INSERT INTO accounts (name, type, initial_balance, balance, icon)
SELECT 'GoPay', 'EWALLET', 250000, 250000, '📱'
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE name = 'GoPay');

INSERT INTO accounts (name, type, initial_balance, balance, icon)
SELECT 'Tabungan Keluarga', 'SAVINGS', 10000000, 10000000, '🐷'
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE name = 'Tabungan Keluarga');

INSERT INTO accounts (name, type, initial_balance, balance, icon)
SELECT 'Lemari Emas', 'GOLD', 0, 0, '🪙'
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE name = 'Lemari Emas');

-- Aset contoh
INSERT INTO assets (name, type, quantity, unit_price, value, note)
SELECT 'Emas Antam 10gr', 'GOLD', 10, 1800000, 18000000, 'Harga emas 10gr'
WHERE NOT EXISTS (SELECT 1 FROM assets LIMIT 1);

INSERT INTO assets (name, type, quantity, unit_price, value, note)
SELECT 'Dinar 1 keping', 'DINAR', 1, 3500000, 3500000, 'Dinar 4.25gr 22k'
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE name = 'Dinar 1 keping');

-- ============================================================================
-- SELESAI!
-- ============================================================================
-- Setelah run, aplikasi siap dipakai. Cek di:
-- - Table Editor: harus ada 8 tabel + data seed
-- - Realtime: harus ada 8 tabel di publication
-- ============================================================================
