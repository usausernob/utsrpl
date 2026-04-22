"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ajukanPinjaman } from "@/app/actions/laboratorium";
import { Send, Loader2 } from "lucide-react";
import NotificationModal, { NotificationType } from "./NotificationModal";

interface BorrowButtonProps {
    assetCategoryId: string;
    disabled: boolean;
}

export default function BorrowButton({ assetCategoryId, disabled }: BorrowButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const [notification, setNotification] = useState<{
        isOpen: boolean;
        type: NotificationType;
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: "success",
        title: "",
        message: ""
    });

    const handleBorrow = () => {
        startTransition(async () => {
            const result = await ajukanPinjaman(assetCategoryId);

            if (!result.success) {
                if (result.error?.includes("login")) {
                    setNotification({
                        isOpen: true,
                        type: "confirm",
                        title: "Perlu Login",
                        message: result.error + "\n\nApakah Anda ingin login sekarang?",
                    });
                } else {
                    setNotification({
                        isOpen: true,
                        type: "error",
                        title: "Gagal",
                        message: result.error || "Gagal mengajukan pinjaman.",
                    });
                }
            } else {
                setNotification({
                    isOpen: true,
                    type: "success",
                    title: "Berhasil",
                    message: "✅ Pinjaman berhasil diajukan! Status: PENDING.\nSilakan cek Dashboard untuk melihat status.",
                });
            }
        });
    };

    return (
        <>
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

            <NotificationModal
                isOpen={notification.isOpen}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                confirmLabel={notification.type === "confirm" ? "Login" : "Tutup"}
                onConfirm={() => {
                    if (notification.type === "confirm") {
                        router.push("/login");
                    }
                    setNotification({ ...notification, isOpen: false });
                }}
                onCancel={() => setNotification({ ...notification, isOpen: false })}
            />
        </>
    );
}
