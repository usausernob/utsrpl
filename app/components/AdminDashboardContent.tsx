"use client";
import { useState } from "react";
import { 
    LayoutDashboard, 
    AlertCircle, 
    RotateCcw, 
    DoorOpen, 
    CalendarDays, 
    Package, 
    CheckCircle2, 
    Inbox,
    Clock,
    ArrowRightLeft,
    XCircle
} from "lucide-react";
import AdminActions from "@/app/components/AdminActions";
import ReturnButton from "@/app/components/ReturnButton";
import BookingAdminActions from "@/app/components/BookingAdminActions";
import AssetCategoryManagement from "@/app/components/AssetCategoryManagement";

const bookingStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: {
        label: "Pending",
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        icon: Clock,
    },
    APPROVED: {
        label: "Disetujui",
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        icon: CheckCircle2,
    },
    COMPLETED: {
        label: "Selesai",
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        icon: CheckCircle2,
    },
    REJECTED: {
        label: "Ditolak",
        color: "bg-red-500/10 text-red-600 dark:text-red-400",
        icon: XCircle,
    },
};

function formatBarcode(prefix: string, nomorUrut: string): string {
    return `${prefix}-${nomorUrut}`;
}

interface AdminDashboardContentProps {
    pendingBorrowings: any[];
    borrowedItems: any[];
    pendingBookings: any[];
    allBookings: any[];
    categoriesForManagement: any[];
    roomLabels: Record<string, string>;
}

export default function AdminDashboardContent({
    pendingBorrowings,
    borrowedItems,
    pendingBookings,
    allBookings,
    categoriesForManagement,
    roomLabels
}: AdminDashboardContentProps) {
    const [activeTab, setActiveTab] = useState<"quick" | "assets">("quick");

    return (
        <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="flex p-1.5 bg-muted/20 rounded-2xl border border-border w-fit">
                <button
                    onClick={() => setActiveTab("quick")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        activeTab === "quick" 
                        ? "bg-surface text-foreground shadow-sm ring-1 ring-border" 
                        : "text-muted hover:text-foreground"
                    }`}
                >
                    <AlertCircle className={`h-4 w-4 ${activeTab === "quick" ? "text-primary" : ""}`} />
                    Tindakan Cepat
                </button>
                <button
                    onClick={() => setActiveTab("assets")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        activeTab === "assets" 
                        ? "bg-surface text-foreground shadow-sm ring-1 ring-border" 
                        : "text-muted hover:text-foreground"
                    }`}
                >
                    <Package className={`h-4 w-4 ${activeTab === "assets" ? "text-primary" : ""}`} />
                    Manajemen Aset
                </button>
            </div>

            {activeTab === "quick" ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* ── TABLE 1: Pending Equipment Requests ── */}
                    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
                        <div className="border-b border-border px-6 py-4 bg-surface-hover/20">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                Antrean Peminjaman Alat
                            </h2>
                            <p className="text-sm text-muted">Permintaan peminjaman yang menunggu persetujuan</p>
                        </div>
                        {pendingBorrowings.length === 0 ? (
                            <div className="flex flex-col items-center py-16">
                                <Inbox className="mb-3 h-10 w-10 text-muted/40" />
                                <p className="font-medium text-foreground">Tidak Ada Antrean</p>
                                <p className="text-sm text-muted">Semua permintaan telah diproses.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-hover/50 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                                            <th className="px-6 py-3">Pemohon</th>
                                            <th className="px-6 py-3">Alat</th>
                                            <th className="px-6 py-3">Tanggal</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {pendingBorrowings.map((b) => (
                                            <tr key={b.id} className="transition-colors hover:bg-surface-hover/30">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-foreground">{b.user.nama}</p>
                                                    <p className="text-xs text-muted">{b.user.email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-foreground">{b.assetItem.category.nama}</p>
                                                    <p className="font-mono text-xs text-muted">{formatBarcode(b.assetItem.category.prefix, b.assetItem.nomorUrut)}</p>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted">
                                                    {new Date(b.tglPinjam).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                        <Clock className="h-3 w-3" />
                                                        Pending
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <AdminActions borrowingId={b.id} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ── TABLE 2: Borrowed Equipment ── */}
                    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
                        <div className="border-b border-border px-6 py-4 bg-surface-hover/20">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                                <RotateCcw className="h-5 w-5 text-blue-500" />
                                Alat Sedang Dipinjam
                            </h2>
                            <p className="text-sm text-muted">Tandai jika alat sudah dikembalikan</p>
                        </div>
                        {borrowedItems.length === 0 ? (
                            <div className="flex flex-col items-center py-16">
                                <CheckCircle2 className="mb-3 h-10 w-10 text-muted/40" />
                                <p className="font-medium text-foreground">Semua Alat Kembali</p>
                                <p className="text-sm text-muted">Tidak ada alat yang sedang dipinjam.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-hover/50 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                                            <th className="px-6 py-3">Peminjam</th>
                                            <th className="px-6 py-3">Alat</th>
                                            <th className="px-6 py-3">Tgl Pinjam</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {borrowedItems.map((b) => (
                                            <tr key={b.id} className="transition-colors hover:bg-surface-hover/30">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-foreground">{b.user.nama}</p>
                                                    <p className="text-xs text-muted">{b.user.email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-foreground">{b.assetItem.category.nama}</p>
                                                    <p className="font-mono text-xs text-muted">{formatBarcode(b.assetItem.category.prefix, b.assetItem.nomorUrut)}</p>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted">
                                                    {new Date(b.tglPinjam).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                        <ArrowRightLeft className="h-3 w-3" />
                                                        Dipinjam
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <ReturnButton borrowingId={b.id} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ── TABLE 3: Pending Room Booking Requests ── */}
                    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
                        <div className="border-b border-border px-6 py-4 bg-surface-hover/20">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                                <DoorOpen className="h-5 w-5 text-purple-500" />
                                Antrean Booking Ruangan
                            </h2>
                            <p className="text-sm text-muted">Permintaan booking ruangan yang menunggu persetujuan</p>
                        </div>
                        {pendingBookings.length === 0 ? (
                            <div className="flex flex-col items-center py-16">
                                <Inbox className="mb-3 h-10 w-10 text-muted/40" />
                                <p className="font-medium text-foreground">Tidak Ada Antrean</p>
                                <p className="text-sm text-muted">Semua booking telah diproses.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-hover/50 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                                            <th className="px-6 py-3">Pemohon</th>
                                            <th className="px-6 py-3">Ruangan</th>
                                            <th className="px-6 py-3">Tanggal</th>
                                            <th className="px-6 py-3">Waktu</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {pendingBookings.map((b) => (
                                            <tr key={b.id} className="transition-colors hover:bg-surface-hover/30">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-foreground">{b.user.nama}</p>
                                                    <p className="text-xs text-muted">{b.user.email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                                        <DoorOpen className="h-3 w-3" />
                                                        {roomLabels[b.roomName] || b.roomName}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted">
                                                    {new Date(b.bookingDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted">
                                                    {b.startTime} — {b.endTime}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                        <Clock className="h-3 w-3" />
                                                        Pending
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <BookingAdminActions bookingId={b.id} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ── TABLE 4: All Room Booking History ── */}
                    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
                        <div className="border-b border-border px-6 py-4 bg-surface-hover/20">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                                <CalendarDays className="h-5 w-5 text-indigo-500" />
                                Riwayat Booking Ruangan
                            </h2>
                            <p className="text-sm text-muted">
                                Semua riwayat pemesanan ruangan laboratorium untuk monitoring
                            </p>
                        </div>
                        {allBookings.length === 0 ? (
                            <div className="flex flex-col items-center py-16">
                                <DoorOpen className="mb-3 h-10 w-10 text-muted/40" />
                                <p className="font-medium text-foreground">Belum Ada Riwayat</p>
                                <p className="text-sm text-muted">Belum ada booking ruangan.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-hover/50 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                                            <th className="px-6 py-3">#</th>
                                            <th className="px-6 py-3">Pemohon</th>
                                            <th className="px-6 py-3">Ruangan</th>
                                            <th className="px-6 py-3">Tanggal</th>
                                            <th className="px-6 py-3">Waktu</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {allBookings.map((b, idx) => {
                                            const cfg = bookingStatusConfig[b.status] || bookingStatusConfig.PENDING;
                                            const StatusIcon = cfg.icon;
                                            return (
                                            <tr key={b.id} className="transition-colors hover:bg-surface-hover/30">
                                                <td className="px-6 py-4 text-sm text-muted">{idx + 1}</td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-foreground">{b.user.nama}</p>
                                                    <p className="text-xs text-muted">{b.user.email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                                        <DoorOpen className="h-3 w-3" />
                                                        {roomLabels[b.roomName] || b.roomName}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted">
                                                    {new Date(b.bookingDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted">
                                                    {b.startTime} — {b.endTime}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {cfg.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in duration-500">
                    <AssetCategoryManagement categories={categoriesForManagement} />
                </div>
            )}
        </div>
    );
}
