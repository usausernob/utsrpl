"use client";

import { useState, useTransition } from "react";
import { returnEquipment } from "@/app/actions/laboratorium";
import { RotateCcw, Loader2 } from "lucide-react";
import NotificationModal, { NotificationType } from "./NotificationModal";

interface ReturnButtonProps {
    borrowingId: string;
}

export default function ReturnButton({ borrowingId }: ReturnButtonProps) {
    const [isPending, startTransition] = useTransition();
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

    return (
        <>
            <button
                onClick={() =>
                    startTransition(async () => {
                        const result = await returnEquipment(borrowingId);
                        if (!result.success) {
                            setNotification({
                                isOpen: true,
                                type: "error",
                                title: "Gagal",
                                message: result.error || "Gagal mengembalikan alat."
                            });
                        }
                    })
                }
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-500/20 hover:shadow-sm disabled:cursor-wait disabled:opacity-50 dark:text-emerald-400"
            >
                {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <RotateCcw className="h-3.5 w-3.5" />
                )}
                Tandai Dikembalikan
            </button>

            <NotificationModal
                isOpen={notification.isOpen}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onConfirm={() => setNotification({ ...notification, isOpen: false })}
                onCancel={() => setNotification({ ...notification, isOpen: false })}
            />
        </>
    );
}
