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

export async function ajukanPinjaman(assetCategoryId: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return { success: false, error: "Anda harus login terlebih dahulu untuk mengajukan pinjaman." };
    }

    const userId = session.user.id;

    try {
        const borrowing = await prisma.$transaction(async (tx) => {
            // Find an available item within the category
            const availableItem = await tx.assetItem.findFirst({
                where: {
                    categoryId: assetCategoryId,
                    kondisi: "BAIK",
                    isAvailable: true,
                },
                orderBy: {
                    createdAt: "asc", // Prioritize older items
                },
            });

            if (!availableItem) {
                throw new Error("Maaf, tidak ada alat yang tersedia atau dalam kondisi baik di kategori ini.");
            }

            // Mark the item as unavailable
            await tx.assetItem.update({
                where: { id: availableItem.id },
                data: { isAvailable: false },
            });

            // Create the borrowing record, linking to the specific AssetItem
            return tx.borrowing.create({
                data: {
                    userId,
                    assetItemId: availableItem.id, // Link to AssetItem
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
                include: { assetItem: true }, // Include the related AssetItem
            });

            if (!borrowing) {
                throw new Error("Data peminjaman tidak ditemukan.");
            }

            await tx.borrowing.update({
                where: { id: borrowingId },
                data: { status: "DITOLAK" },
            });

            // If a specific item was borrowed, make it available again
            if (borrowing.assetItem) {
                await tx.assetItem.update({
                    where: { id: borrowing.assetItem.id },
                    data: { isAvailable: true },
                });
            }
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
                include: { assetItem: true }, // Include the related AssetItem
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

            // Make the item available again
            if (borrowing.assetItem) {
                await tx.assetItem.update({
                    where: { id: borrowing.assetItem.id },
                    data: { isAvailable: true },
                });
            }
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
