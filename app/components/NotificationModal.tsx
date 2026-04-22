"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, HelpCircle, X, Loader2 } from "lucide-react";

export type NotificationType = "success" | "error" | "confirm" | "info";

interface NotificationModalProps {
    isOpen: boolean;
    type: NotificationType;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    isPending?: boolean;
}

export default function NotificationModal({
    isOpen,
    type,
    title,
    message,
    confirmLabel = "OK",
    cancelLabel = "Batal",
    onConfirm,
    onCancel,
    isPending = false
}: NotificationModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
    };

    const icons = {
        success: <CheckCircle2 className="h-12 w-12 text-green-500" />,
        error: <AlertCircle className="h-12 w-12 text-red-500" />,
        confirm: <HelpCircle className="h-12 w-12 text-primary" />,
        info: <AlertCircle className="h-12 w-12 text-blue-500" />
    };

    return (
        <dialog
            ref={dialogRef}
            className="fixed inset-0 m-auto rounded-2xl border border-border bg-surface p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm w-[calc(100%-2rem)] max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 focus:outline-none"
            onClose={handleCancel}
        >
            <div className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                    {icons[type]}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                <p className="text-muted text-sm whitespace-pre-wrap">{message}</p>
            </div>
            
            <div className="flex border-t border-border">
                {type === "confirm" && (
                    <button
                        onClick={handleCancel}
                        disabled={isPending}
                        className="flex-1 px-4 py-4 text-sm font-semibold text-muted hover:bg-surface-hover transition-colors border-r border-border disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                )}
                <button
                    onClick={handleConfirm}
                    disabled={isPending}
                    className={`flex-1 px-4 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                        type === "error" 
                        ? "text-red-500 hover:bg-red-500/5" 
                        : "text-primary hover:bg-primary/5"
                    }`}
                >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {confirmLabel}
                </button>
            </div>
        </dialog>
    );
}
