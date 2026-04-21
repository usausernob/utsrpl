import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client.js";
import { hash } from "bcryptjs";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...\n");

    // Clean existing data (order matters for FK constraints)
    await prisma.borrowing.deleteMany();
    await prisma.assetItem.deleteMany();
    await prisma.assetCategory.deleteMany();
    await prisma.roomBooking.deleteMany();
    await prisma.user.deleteMany();

    // ─── Users ───────────────────────────────────────────────────────────────
    const hashedPassword = await hash("password123", 10);

    const mahasiswa = await prisma.user.create({
        data: {
            nama: "Budi Santoso",
            email: "budi@mahasiswa.ac.id",
            password: hashedPassword,
            role: "MAHASISWA",
        },
    });

    const laboran = await prisma.user.create({
        data: {
            nama: "Siti Laboran",
            email: "siti@lab.ac.id",
            password: hashedPassword,
            role: "LABORAN",
        },
    });

    const kepalaLab = await prisma.user.create({
        data: {
            nama: "Dr. Ahmad Kepala",
            email: "ahmad@lab.ac.id",
            password: hashedPassword,
            role: "KEPALA_LAB",
        },
    });

    console.log("✅ Users created:");
    console.log(`   - ${mahasiswa.nama} (${mahasiswa.role})`);
    console.log(`   - ${laboran.nama} (${laboran.role})`);
    console.log(`   - ${kepalaLab.nama} (${kepalaLab.role})`);

    // ─── Asset Categories ─────────────────────────────────────────────────────
    const categories = await Promise.all([
        prisma.assetCategory.create({
            data: {
                nama: "PC Desktop All-in-One",
                deskripsi: "Komputer desktop all-in-one untuk kebutuhan praktikum",
                prefix: "PC",
            },
        }),
        prisma.assetCategory.create({
            data: {
                nama: "Laptop ASUS VivoBook",
                deskripsi: "Laptop portabel untuk kebutuhan praktikum mobile",
                prefix: "LPT",
            },
        }),
        prisma.assetCategory.create({
            data: {
                nama: "Monitor LED 24 inch",
                deskripsi: "Monitor eksternal 24 inci resolusi Full HD",
                prefix: "MON",
            },
        }),
        prisma.assetCategory.create({
            data: {
                nama: "Keyboard Mechanical",
                deskripsi: "Keyboard mekanikal untuk penggunaan intensif",
                prefix: "KB",
            },
        }),
        prisma.assetCategory.create({
            data: {
                nama: "Mouse Wireless Logitech",
                deskripsi: "Mouse nirkabel ergonomis Logitech",
                prefix: "MS",
            },
        }),
        prisma.assetCategory.create({
            data: {
                nama: "Proyektor Epson",
                deskripsi: "Proyektor presentasi Epson untuk ruang kuliah",
                prefix: "PRJ",
            },
        }),
        prisma.assetCategory.create({
            data: {
                nama: "Printer LaserJet HP",
                deskripsi: "Printer laser HP untuk kebutuhan cetak dokumen",
                prefix: "PRN",
            },
        }),
        prisma.assetCategory.create({
            data: {
                nama: "Headset USB Logitech",
                deskripsi: "Headset USB Logitech untuk praktikum multimedia",
                prefix: "HST",
            },
        }),
        prisma.assetCategory.create({
            data: {
                nama: "Switch Managed 24-Port",
                deskripsi: "Switch jaringan terkelola 24 port untuk lab jaringan",
                prefix: "SWT",
            },
        }),
        prisma.assetCategory.create({
            data: {
                nama: "Router MikroTik",
                deskripsi: "Router MikroTik untuk praktikum jaringan",
                prefix: "RTR",
            },
        }),
        prisma.assetCategory.create({
            data: {
                nama: "UPS APC 1200VA",
                deskripsi: "UPS APC 1200VA untuk proteksi daya perangkat lab",
                prefix: "UPS",
            },
        }),
        prisma.assetCategory.create({
            data: {
                nama: "External HDD 1TB",
                deskripsi: "Hard disk eksternal 1TB untuk penyimpanan data",
                prefix: "HDD",
            },
        }),
    ]);

    console.log(`\n✅ ${categories.length} asset categories created`);

    // ─── Asset Items ──────────────────────────────────────────────────────────
    // Helper to build nomorUrut strings like "001", "002", etc.
    const pad = (n: number) => String(n).padStart(3, "0");

    // Map: categoryIndex -> { count, kondisi }
    const itemConfig: { count: number; kondisi: "BAIK" | "RUSAK" }[] = [
        { count: 20, kondisi: "BAIK" },  // PC Desktop (2 unavailable → handled via borrowing)
        { count: 10, kondisi: "BAIK" },  // Laptop
        { count: 20, kondisi: "BAIK" },  // Monitor
        { count: 25, kondisi: "BAIK" },  // Keyboard
        { count: 25, kondisi: "BAIK" },  // Mouse
        { count: 3,  kondisi: "BAIK" },  // Proyektor
        { count: 4,  kondisi: "RUSAK" }, // Printer (all rusak)
        { count: 15, kondisi: "BAIK" },  // Headset
        { count: 2,  kondisi: "RUSAK" }, // Switch (rusak)
        { count: 5,  kondisi: "BAIK" },  // Router
        { count: 10, kondisi: "BAIK" },  // UPS
        { count: 8,  kondisi: "BAIK" },  // HDD
    ];

    const allItems: { categoryIndex: number; item: Awaited<ReturnType<typeof prisma.assetItem.create>> }[] = [];

    for (let ci = 0; ci < categories.length; ci++) {
        const { count, kondisi } = itemConfig[ci];
        for (let i = 1; i <= count; i++) {
            const item = await prisma.assetItem.create({
                data: {
                    categoryId: categories[ci].id,
                    nomorUrut: pad(i),
                    kondisi,
                    isAvailable: kondisi === "BAIK", // RUSAK items start as unavailable
                },
            });
            allItems.push({ categoryIndex: ci, item });
        }
    }

    const totalItems = allItems.length;
    console.log(`✅ ${totalItems} asset items created`);

    // ─── Sample Borrowings ────────────────────────────────────────────────────
    // Pick first item from Laptop category (index 1)
    const laptopItems = allItems.filter((x) => x.categoryIndex === 1);
    // Pick first item from Proyektor category (index 5)
    const proyektorItems = allItems.filter((x) => x.categoryIndex === 5);
    // Pick first item from HDD category (index 11)
    const hddItems = allItems.filter((x) => x.categoryIndex === 11);

    await prisma.borrowing.create({
        data: {
            userId: mahasiswa.id,
            assetItemId: laptopItems[0].item.id,
            status: "PENDING",
        },
    });

    // Mark the borrowed laptop as unavailable
    await prisma.assetItem.update({
        where: { id: laptopItems[0].item.id },
        data: { isAvailable: false },
    });

    await prisma.borrowing.create({
        data: {
            userId: mahasiswa.id,
            assetItemId: proyektorItems[0].item.id,
            status: "DIPINJAM",
        },
    });

    await prisma.assetItem.update({
        where: { id: proyektorItems[0].item.id },
        data: { isAvailable: false },
    });

    await prisma.borrowing.create({
        data: {
            userId: mahasiswa.id,
            assetItemId: hddItems[0].item.id,
            status: "SELESAI",
            returnedDate: new Date(),
        },
    });

    console.log("✅ Sample borrowings created\n");
    console.log("🎉 Seed complete!\n");
    console.log("📋 Login credentials (all accounts use password: password123):");
    console.log("   Mahasiswa : budi@mahasiswa.ac.id");
    console.log("   Laboran   : siti@lab.ac.id");
    console.log("   Kepala Lab: ahmad@lab.ac.id");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
