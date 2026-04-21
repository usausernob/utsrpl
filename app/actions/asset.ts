"use server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { revalidatePath } from "next/cache";

// Helper to generate a unique prefix
function generatePrefixFromName(name: string): string {
    const words = name.split(/[\s-]+/);
    let prefix = "";
    for (const word of words) {
        if (word.length > 0) {
            prefix += word[0].toUpperCase();
        }
    }
    if (prefix.length < 3 && name.length >= 3) {
        prefix = name.substring(0, 3).toUpperCase();
    }
    return prefix.substring(0, 3); // Ensure prefix is max 3 characters
}

// ──────────────────────────────────────────────────────
// Asset Category Actions
// ──────────────────────────────────────────────────────

export async function createAssetCategory(nama: string, deskripsi: string | null) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !["LABORAN", "KEPALA_LAB"].includes(session.user.role)) {
        return { success: false, error: "Anda tidak memiliki akses untuk membuat kategori aset." };
    }

    try {
        const generatedPrefix = generatePrefixFromName(nama);

        const newCategory = await prisma.assetCategory.create({
            data: {
                nama,
                deskripsi,
                prefix: generatedPrefix,
            },
        });

        revalidatePath("/dashboard");
        return { success: true, category: newCategory };
    } catch (err: any) {
        if (err.code === 'P2002') {
            return { success: false, error: "Nama kategori atau prefix sudah ada. Harap gunakan nama dan prefix yang unik." };
        }
        return { success: false, error: err instanceof Error ? err.message : "Gagal membuat kategori aset." };
    }
}

export async function updateAssetCategory(id: string, nama: string, deskripsi: string | null) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !["LABORAN", "KEPALA_LAB"].includes(session.user.role)) {
        return { success: false, error: "Anda tidak memiliki akses untuk memperbarui kategori aset." };
    }

    try {
        const updatedCategory = await prisma.assetCategory.update({
            where: { id },
            data: {
                nama,
                deskripsi,
            },
        });

        revalidatePath("/dashboard");
        return { success: true, category: updatedCategory };
    } catch (err: any) {
        if (err.code === 'P2002') {
            return { success: false, error: "Nama kategori sudah ada. Harap gunakan nama yang unik." };
        }
        return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui kategori aset." };
    }
}

export async function deleteAssetCategory(id: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !["LABORAN", "KEPALA_LAB"].includes(session.user.role)) {
        return { success: false, error: "Anda tidak memiliki akses untuk menghapus kategori aset." };
    }

    try {
        await prisma.assetCategory.delete({
            where: { id },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus kategori aset." };
    }
}

// ──────────────────────────────────────────────────────
// Asset Item Actions
// ──────────────────────────────────────────────────────

export async function createAssetItem(categoryId: string, nomorUrut: string, kondisi: "BAIK" | "RUSAK") {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !["LABORAN", "KEPALA_LAB"].includes(session.user.role)) {
        return { success: false, error: "Anda tidak memiliki akses untuk membuat item aset." };
    }

    try {
        const newAssetItem = await prisma.assetItem.create({
            data: {
                categoryId,
                nomorUrut,
                kondisi,
                isAvailable: kondisi === "BAIK", // Only good items are available by default
            },
        });

        revalidatePath("/dashboard");
        return { success: true, item: newAssetItem };
    } catch (err: any) {
        if (err.code === 'P2002') {
            return { success: false, error: `Item dengan nomor urut '${nomorUrut}' sudah ada di kategori ini.` };
        }
        return { success: false, error: err instanceof Error ? err.message : "Gagal membuat item aset." };
    }
}

export async function updateAssetItem(id: string, kondisi: "BAIK" | "RUSAK", isAvailable: boolean) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !["LABORAN", "KEPALA_LAB"].includes(session.user.role)) {
        return { success: false, error: "Anda tidak memiliki akses untuk memperbarui item aset." };
    }

    try {
        const updatedItem = await prisma.assetItem.update({
            where: { id },
            data: {
                kondisi,
                isAvailable,
            },
        });

        revalidatePath("/dashboard");
        return { success: true, item: updatedItem };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui item aset." };
    }
}

export async function deleteAssetItem(id: string) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || !["LABORAN", "KEPALA_LAB"].includes(session.user.role)) {
        return { success: false, error: "Anda tidak memiliki akses untuk menghapus item aset." };
    }

    try {
        await prisma.assetItem.delete({
            where: { id },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus item aset." };
    }
}
