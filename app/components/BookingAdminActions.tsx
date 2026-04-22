"use client";

import { useState, useTransition } from "react";
import { approveBooking, rejectBooking } from "@/app/actions/laboratorium";
import { Check, X, Loader2 } from "lucide-react";
import NotificationModal, { NotificationType } from "./NotificationModal";

interface BookingAdminActionsProps {
    bookingId: string;
}

export default function BookingAdminActions({ bookingId }: BookingAdminActionsProps) {
    const [isApproving, startApprove] = useTransition();
    const [isRejecting, startReject] = useTransition();
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
        <div className="flex items-center gap-2">
            <button
                onClick={() =>
                    startApprove(async () => {
                        const result = await approveBooking(bookingId);
                        if (!result.success) {
                            setNotification({
                                isOpen: true,
                                type: "error",
                                title: "Gagal",
                                message: result.error || "Gagal menyetujui."
                            });
                        }
                    })
                }
                disabled={isApproving || isRejecting}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-500/20 hover:shadow-sm disabled:cursor-wait disabled:opacity-50 dark:text-emerald-400"
            >
                {isApproving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Check className="h-3.5 w-3.5" />
                )}
                Setujui
            </button>
            <button
                onClick={() =>
                    startReject(async () => {
                        const result = await rejectBooking(bookingId);
                        if (!result.success) {
                            setNotification({
                                isOpen: true,
                                type: "error",
                                title: "Gagal",
                                message: result.error || "Gagal menolak."
                            });
                        }
                    })
                }
                disabled={isApproving || isRejecting}
                className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-500/20 hover:shadow-sm disabled:cursor-wait disabled:opacity-50 dark:text-red-400"
            >
                {isRejecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <X className="h-3.5 w-3.5" />
                )}
                Tolak
            </button>

            <NotificationModal
                isOpen={notification.isOpen}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onConfirm={() => setNotification({ ...notification, isOpen: false })}
                onCancel={() => setNotification({ ...notification, isOpen: false })}
            />
        </div>
    );
}
