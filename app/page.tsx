import { prisma } from "@/app/lib/prisma";
import BorrowButton from "@/app/components/BorrowButton";
import SearchBar from "@/app/components/SearchBar";
import PageTabs from "@/app/components/PageTabs";
import RoomBookingSection from "@/app/components/RoomBookingSection";
import {
    FlaskConical,
    Package,
    Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{ q?: string; tab?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
    const { q, tab } = await searchParams;
    const activeTab = tab || "equipment";

    const assetCategories =
        activeTab === "equipment"
            ? await prisma.assetCategory.findMany({
                  where: q
                      ? {
                            OR: [
                                { nama: { contains: q, mode: "insensitive" } },
                                { deskripsi: { contains: q, mode: "insensitive" } },
                            ],
                        }
                      : undefined,
                  include: {
                      items: {
                          select: {
                              id: true,
                              kondisi: true,
                              isAvailable: true,
                          },
                      },
                  },
                  orderBy: { nama: "asc" },
              })
            : [];

    // Calculate stock for each category
    const categoriesWithStock = assetCategories.map((category) => {
        const totalStock = category.items.length;
        const availableStock = category.items.filter(
            (item) => item.kondisi === "BAIK" && item.isAvailable
        ).length;
        return {
            ...category,
            totalStock,
            availableStock,
        };
    });


    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-background pb-16 pt-12">
                {/* Decorative Elements */}
                <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
                <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-6 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                            <Sparkles className="h-4 w-4" />
                            Sistem Manajemen Laboratorium Terpadu
                        </div>

                        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                            Selamat Datang di{" "}
                            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                LabsInc
                            </span>
                        </h1>

                        <p className="mt-5 max-w-2xl text-lg text-muted sm:text-xl">
                            Platform terpadu untuk pengelolaan aset laboratorium, peminjaman
                            alat, booking ruangan, dan monitoring ketersediaan secara real-time.
                        </p>

                        {/* Search Bar — only visible on equipment tab */}
                        {activeTab === "equipment" && (
                            <div className="mt-8 w-full max-w-xl">
                                <SearchBar />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Tabs */}
                <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <PageTabs />
                    {activeTab === "equipment" && (
                        <div className="hidden items-center gap-2 rounded-lg bg-surface-hover px-3 py-1.5 text-sm text-muted sm:flex">
                            <Package className="h-4 w-4" />
                            Total Kategori: {categoriesWithStock.length}
                        </div>
                    )}
                </div>

                {/* Equipment Catalog Tab */}
                {activeTab === "equipment" && (
                    <>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                                Katalog Alat
                            </h2>
                            <p className="mt-1 text-sm text-muted">
                                {categoriesWithStock.length} kategori alat tersedia di laboratorium
                            </p>
                        </div>

                        {categoriesWithStock.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24">
                                <FlaskConical className="mb-4 h-12 w-12 text-muted/40" />
                                <h3 className="text-lg font-semibold text-foreground">
                                    Belum Ada Kategori Aset
                                </h3>
                                <p className="mt-1 text-sm text-muted">
                                    Data kategori aset laboratorium belum tersedia.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {categoriesWithStock.map((category) => (
                                    <div
                                        key={category.id}
                                        className="group relative flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
                                    >
                                        {/* Header */}
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                                                <FlaskConical className="h-5 w-5 text-primary" />
                                            </div>
                                            {/* Removed Kondisi display for category */}
                                        </div>

                                        {/* Info */}
                                        <h3 className="mb-1 text-lg font-bold text-foreground">
                                            {category.nama}
                                        </h3>
                                        <p className="mb-4 text-sm text-muted-foreground">{category.deskripsi}</p>

                                        {/* Stock */}
                                        <div className="mb-4 flex items-center justify-between rounded-xl bg-surface-hover p-3">
                                            <span className="text-sm text-muted">Stok Tersedia</span>
                                            <div className="flex items-baseline gap-1">
                                                <span
                                                    className={`text-xl font-bold ${category.availableStock > 0
                                                        ? "text-primary"
                                                        : "text-red-500"
                                                        }`}
                                                >
                                                    {category.availableStock}
                                                </span>
                                                <span className="text-xs text-muted">
                                                    / {category.totalStock}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Borrow Button */}
                                        <div className="mt-auto">
                                            <BorrowButton
                                                assetCategoryId={category.id} // Pass category ID
                                                disabled={category.availableStock <= 0}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Room Booking Tab */}
                {activeTab === "rooms" && (
                    <>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                                Booking Ruangan
                            </h2>
                            <p className="mt-1 text-sm text-muted">
                                Pilih ruang laboratorium dan tentukan jadwal pemesanan
                            </p>
                        </div>

                        <RoomBookingSection />
                    </>
                )}
            </section>
        </div>
    );
}
