"use server";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

const VALID_ROOMS = ["LAB_RPL", "LAB_JARKOM", "LAB_MM", "LAB_SI"] as const;
type RoomName = (typeof VALID_ROOMS)[number];

// ──────────────────────────────────────────────────────
// Equipment Borrowing Actions
// ──────────────────────────────────────────────────────

export async function ajukanPinjaman(assetId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return { success: false, error: "Anda harus login terlebih dahulu untuk mengajukan pinjaman." };
    }

    const userId = session.user.id;

    try {
        const borrowing = await prisma.$transaction(async (tx) => {
            const asset = await tx.asset.findUnique({
                where: { id: assetId },
            });

            if (!asset) {
                throw new Error("Alat tidak ditemukan.");
            }

            if (asset.stokTersedia <= 0) {
                throw new Error("Maaf, stok alat ini sedang tidak tersedia.");
            }

            await tx.asset.update({
                where: { id: assetId },
                data: { stokTersedia: { decrement: 1 } },
            });

            return tx.borrowing.create({
                data: {
                    userId,
                    assetId,
                    status: "PENDING",
                },
            });
        });

        revalidatePath("/");
        revalidatePath("/dashboard");

        return { success: true, borrowingId: borrowing.id };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Gagal mengajukan pinjaman." };
    }
}

export async function setujuiPinjaman(borrowingId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !["LABORAN", "KEPALA_LAB"].includes(session.user.role)) {
        return { success: false, error: "Anda tidak memiliki akses untuk menyetujui pinjaman." };
    }

    try {
        await prisma.borrowing.update({
            where: { id: borrowingId },
            data: { status: "DIPINJAM" },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Gagal menyetujui pinjaman." };
    }
}

export async function tolakPinjaman(borrowingId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !["LABORAN", "KEPALA_LAB"].includes(session.user.role)) {
        return { success: false, error: "Anda tidak memiliki akses untuk menolak pinjaman." };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const borrowing = await tx.borrowing.findUnique({
                where: { id: borrowingId },
            });

            if (!borrowing) {
                throw new Error("Data peminjaman tidak ditemukan.");
            }

            await tx.borrowing.update({
                where: { id: borrowingId },
                data: { status: "DITOLAK" },
            });

            await tx.asset.update({
                where: { id: borrowing.assetId },
                data: { stokTersedia: { increment: 1 } },
            });
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Gagal menolak pinjaman." };
    }
}

// ──────────────────────────────────────────────────────
// Equipment Return Action
// ──────────────────────────────────────────────────────

export async function returnEquipment(borrowingId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !["LABORAN", "KEPALA_LAB"].includes(session.user.role)) {
        return { success: false, error: "Anda tidak memiliki akses untuk mengembalikan alat." };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const borrowing = await tx.borrowing.findUnique({
                where: { id: borrowingId },
            });

            if (!borrowing) {
                throw new Error("Data peminjaman tidak ditemukan.");
            }

            if (borrowing.status !== "DIPINJAM") {
                throw new Error("Alat ini tidak dalam status dipinjam.");
            }

            await tx.borrowing.update({
                where: { id: borrowingId },
                data: {
                    status: "SELESAI",
                    returnedDate: new Date(),
                },
            });

            await tx.asset.update({
                where: { id: borrowing.assetId },
                data: { stokTersedia: { increment: 1 } },
            });
        });

        revalidatePath("/");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Gagal mengembalikan alat." };
    }
}

// ──────────────────────────────────────────────────────
// Room Booking Actions
// ──────────────────────────────────────────────────────

export async function bookRoom(
    roomName: string,
    bookingDate: string,
    startTime: string,
    endTime: string
) {
    if (!VALID_ROOMS.includes(roomName as RoomName)) {
        return { success: false, error: "Nama ruangan tidak valid." };
    }
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return { success: false, error: "Anda harus login terlebih dahulu untuk booking ruangan." };
    }

    try {
        const booking = await prisma.roomBooking.create({
            data: {
                userId: session.user.id,
                roomName: roomName as RoomName,
                bookingDate: new Date(bookingDate),
                startTime,
                endTime,
                status: "PENDING",
            },
        });

        revalidatePath("/");
        revalidatePath("/dashboard");
        return { success: true, bookingId: booking.id };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Gagal membooking ruangan." };
    }
}

export async function approveBooking(bookingId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !["LABORAN", "KEPALA_LAB"].includes(session.user.role)) {
        return { success: false, error: "Anda tidak memiliki akses." };
    }

    try {
        await prisma.roomBooking.update({
            where: { id: bookingId },
            data: { status: "APPROVED" },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Gagal menyetujui booking." };
    }
}

export async function rejectBooking(bookingId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !["LABORAN", "KEPALA_LAB"].includes(session.user.role)) {
        return { success: false, error: "Anda tidak memiliki akses." };
    }

    try {
        await prisma.roomBooking.update({
            where: { id: bookingId },
            data: { status: "REJECTED" },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Gagal menolak booking." };
    }
}
