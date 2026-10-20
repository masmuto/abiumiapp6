// Seed data: users (Abi & Umi), kategori default, rekening contoh
// Jalankan: bun run db:seed
import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES, DEFAULT_USERS } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Users
  for (const u of DEFAULT_USERS) {
    await prisma.user.upsert({
      where: { name: u.name },
      update: {},
      create: { ...u },
    });
  }
  console.log("✓ Users: Abi & Umi");

  // 2. Kategori default - cek duplikat manual (SQLite tidak mendukung unique composite by default)
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type },
    });
    if (!existing) {
      await prisma.category.create({
        data: { ...cat, isDefault: true },
      });
    }
  }
  console.log(`✓ ${DEFAULT_CATEGORIES.length} kategori default`);

  // 3. Rekening contoh (jika belum ada)
  const existingAccounts = await prisma.account.count();
  if (existingAccounts === 0) {
    await prisma.account.createMany({
      data: [
        { name: "Tunai Dompet", type: "CASH", initialBalance: 500000, balance: 500000, icon: "💵" },
        { name: "Bank BCA", type: "BANK", initialBalance: 5000000, balance: 5000000, icon: "🏦" },
        { name: "GoPay", type: "EWALLET", initialBalance: 250000, balance: 250000, icon: "📱" },
        { name: "Tabungan Keluarga", type: "SAVINGS", initialBalance: 10000000, balance: 10000000, icon: "🐷" },
        { name: "Lemari Emas", type: "GOLD", initialBalance: 0, balance: 0, icon: "🪙" },
      ],
    });
    console.log("✓ 5 rekening contoh");
  } else {
    console.log(`~ Sudah ada ${existingAccounts} rekening, skip`);
  }

  // 4. Aset contoh (jika belum ada)
  const existingAssets = await prisma.asset.count();
  if (existingAssets === 0) {
    await prisma.asset.createMany({
      data: [
        { name: "Emas Antam 10gr", type: "GOLD", quantity: 10, unitPrice: 1800000, value: 18000000, note: "Harga emas 10gr" },
        { name: "Dinar 1 keping", type: "DINAR", quantity: 1, unitPrice: 3500000, value: 3500000, note: "Dinar 4.25gr 22k" },
      ],
    });
    console.log("✓ 2 aset contoh");
  }

  console.log("\n🎉 Seeding selesai!");
  console.log("   Login: pilih 'Abi' atau 'Umi' di aplikasi");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
