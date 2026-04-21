"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajukanPinjaman } from "@/app/actions/laboratorium";
import { Send, Loader2 } from "lucide-react";

interface BorrowButtonProps {
    assetCategoryId: string; // Changed from assetId
    disabled: boolean;
}

export default function BorrowButton({ assetCategoryId, disabled }: BorrowButtonProps) { // Changed from assetId
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleBorrow = () => {
        startTransition(async () => {
            const result = await ajukanPinjaman(assetCategoryId); // Changed from assetId

            if (!result.success) {
                if (result.error?.includes("login")) {
                    const confirmLogin = window.confirm(
                        result.error + "\n\nApakah Anda ingin login sekarang?"
                    );
                    if (confirmLogin) {
                        router.push("/login");
                    }
                } else {
                    alert(result.error || "Gagal mengajukan pinjaman.");
                }
            } else {
                alert("✅ Pinjaman berhasil diajukan! Status: PENDING.\nSilakan cek Dashboard untuk melihat status.");
            }
        });
    };

    return (
        <button
            onClick={handleBorrow}
            disabled={disabled || isPending}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${disabled
                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
                    : isPending
                        ? "cursor-wait bg-primary/80 text-white"
                        : "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
                }`}
        >
            {isPending ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                </>
            ) : disabled ? (
                "Stok Habis"
            ) : (
                <>
                    <Send className="h-4 w-4" />
                    Ajukan Pinjam
                </>
            )}
        </button>
    );
}
