"use client";

import { useState, useTransition, useRef } from "react";
import { createAssetCategory, updateAssetCategory, deleteAssetCategory, createAssetItem, updateAssetItem, deleteAssetItem } from "@/app/actions/asset";
import { Plus, Edit, Trash2, Loader2, FlaskConical, Package, Barcode } from "lucide-react";

interface AssetItem {
    id: string;
    categoryId: string;
    nomorUrut: string;
    kondisi: "BAIK" | "RUSAK";
    isAvailable: boolean;
}

interface AssetCategory {
    id: string;
    nama: string;
    deskripsi: string | null;
    prefix: string;
    items: AssetItem[];
    totalStock?: number;
    availableStock?: number;
}

interface AssetCategoryManagementProps {
    categories: AssetCategory[];
}

// Shared button class helpers
const btnBase =
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50";
const btnPrimary =
    "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98] px-4 py-2.5";
const btnOutline =
    "border border-border bg-surface text-foreground hover:bg-surface-hover px-4 py-2.5";
const btnDestructive =
    "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] px-4 py-2.5";
const btnIcon =
    "border border-border bg-surface hover:bg-surface-hover h-9 w-9 p-0 rounded-md text-muted hover:text-foreground";

export default function AssetCategoryManagement({ categories }: AssetCategoryManagementProps) {
    const [isPending, startTransition] = useTransition();
    const [currentCategory, setCurrentCategory] = useState<AssetCategory | null>(null);
    
    // Category form state
    const [categoryName, setCategoryName] = useState("");
    const [categoryDescription, setCategoryDescription] = useState<string | null>(null);
    
    // Item management state
    const [lookupId, setLookupId] = useState("");
    const [foundItem, setFoundItem] = useState<AssetItem | null>(null);
    const [newItemNomorUrut, setNewItemNomorUrut] = useState("");
    
    const [error, setError] = useState<string | null>(null);

    const addEditDialogRef = useRef<HTMLDialogElement>(null);
    const deleteDialogRef = useRef<HTMLDialogElement>(null);
    const manageItemsDialogRef = useRef<HTMLDialogElement>(null);

    const handleAddEditClick = (category: AssetCategory | null = null) => {
        setCurrentCategory(category);
        setCategoryName(category?.nama || "");
        setCategoryDescription(category?.deskripsi || "");
        setError(null);
        addEditDialogRef.current?.showModal();
    };

    const handleDeleteClick = (category: AssetCategory) => {
        setCurrentCategory(category);
        setError(null);
        deleteDialogRef.current?.showModal();
    };

    const handleManageItemsClick = (category: AssetCategory) => {
        setCurrentCategory(category);
        setLookupId("");
        setFoundItem(null);
        setNewItemNomorUrut("");
        setError(null);
        manageItemsDialogRef.current?.showModal();
    };

    const closeAddEditDialog = () => {
        addEditDialogRef.current?.close();
        setCurrentCategory(null);
        setCategoryName("");
        setCategoryDescription(null);
        setError(null);
    };

    const closeDeleteDialog = () => {
        deleteDialogRef.current?.close();
        setCurrentCategory(null);
        setError(null);
    };

    const closeManageItemsDialog = () => {
        manageItemsDialogRef.current?.close();
        setCurrentCategory(null);
        setLookupId("");
        setFoundItem(null);
        setError(null);
    };

    const handleLookup = (id: string) => {
        setLookupId(id);
        if (id.length === 3 && currentCategory) {
            const item = currentCategory.items.find(i => i.nomorUrut === id);
            setFoundItem(item || null);
        } else {
            setFoundItem(null);
        }
    };

    const handleUpdateItem = async (itemId: string, kondisi: "BAIK" | "RUSAK", isAvailable: boolean) => {
        startTransition(async () => {
            const result = await updateAssetItem(itemId, kondisi, isAvailable);
            if (result.success) {
                // Refresh local state or just let the page revalidate
                // Since this is a client component in a server page, revalidatePath will refresh the 'categories' prop
                if (foundItem) {
                    setFoundItem({ ...foundItem, kondisi, isAvailable });
                }
            } else {
                setError(result.error || "Gagal memperbarui item.");
            }
        });
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus item ini?")) return;
        startTransition(async () => {
            const result = await deleteAssetItem(itemId);
            if (result.success) {
                setFoundItem(null);
                setLookupId("");
            } else {
                setError(result.error || "Gagal menghapus item.");
            }
        });
    };

    const handleAddItem = async () => {
        if (!currentCategory || !newItemNomorUrut.match(/^\d{3}$/)) {
            setError("Nomor urut harus 3 digit angka.");
            return;
        }

        startTransition(async () => {
            const result = await createAssetItem(currentCategory.id, newItemNomorUrut, "BAIK");
            if (result.success) {
                setNewItemNomorUrut("");
                handleLookup(newItemNomorUrut);
            } else {
                setError(result.error || "Gagal menambah item.");
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!categoryName.trim()) {
            setError("Nama kategori tidak boleh kosong.");
            return;
        }

        startTransition(async () => {
            let result;
            if (currentCategory) {
                result = await updateAssetCategory(currentCategory.id, categoryName, categoryDescription);
            } else {
                result = await createAssetCategory(categoryName, categoryDescription);
            }

            if (result.success) {
                closeAddEditDialog();
            } else {
                setError(result.error || "Terjadi kesalahan.");
            }
        });
    };

    const confirmDelete = async () => {
        if (!currentCategory) return;
        setError(null);

        startTransition(async () => {
            const result = await deleteAssetCategory(currentCategory.id);
            if (result.success) {
                closeDeleteDialog();
            } else {
                setError(result.error || "Gagal menghapus kategori.");
            }
        });
    };

    return (
        <div className="rounded-2xl border border-border bg-surface shadow-sm mb-8">
            <div className="border-b border-border px-6 py-4 flex justify-between items-center">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                        <Package className="h-5 w-5 text-indigo-500" />
                        Manajemen Kategori Aset
                    </h2>
                    <p className="text-sm text-muted">Tambah, edit, atau hapus kategori aset dan lihat detail stok.</p>
                </div>
                <button
                    onClick={() => handleAddEditClick()}
                    className={`${btnBase} ${btnPrimary} gap-2`}
                >
                    <Plus className="h-4 w-4" />
                    Tambah Kategori
                </button>
            </div>
            <div className="overflow-x-auto">
                {categories.length === 0 ? (
                    <div className="flex flex-col items-center py-16">
                        <FlaskConical className="mb-3 h-10 w-10 text-muted/40" />
                        <p className="font-medium text-foreground">Tidak Ada Kategori Aset</p>
                        <p className="text-sm text-muted">Mulai dengan menambahkan kategori aset baru.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-surface-hover/50 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                                <th className="px-6 py-3">Nama Kategori</th>
                                <th className="px-6 py-3">Deskripsi</th>
                                <th className="px-6 py-3">Prefix</th>
                                <th className="px-6 py-3 text-center">Total Item</th>
                                <th className="px-6 py-3 text-center">Item Tersedia</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {categories.map((category) => (
                                <tr key={category.id} className="transition-colors hover:bg-surface-hover/30">
                                    <td className="px-6 py-4 text-sm font-medium text-foreground">{category.nama}</td>
                                    <td className="px-6 py-4 text-sm text-muted">{category.deskripsi || "-"}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-muted">{category.prefix}</td>
                                    <td className="px-6 py-4 text-center text-sm text-foreground">{category.totalStock ?? "-"}</td>
                                    <td className="px-6 py-4 text-center text-sm text-primary">{category.availableStock ?? "-"}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleManageItemsClick(category)}
                                                disabled={isPending}
                                                title="Kelola unit fisik"
                                                className={`${btnBase} ${btnOutline} gap-1.5 h-9 px-3`}
                                            >
                                                <Barcode className="h-4 w-4 text-primary" />
                                                Unit
                                            </button>
                                            <button
                                                onClick={() => handleAddEditClick(category)}
                                                disabled={isPending}
                                                title="Edit kategori"
                                                className={`${btnBase} ${btnIcon}`}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(category)}
                                                disabled={isPending}
                                                title="Hapus kategori"
                                                className={`${btnBase} ${btnIcon} text-red-500 hover:text-red-600`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Manage Items Dialog */}
            <dialog ref={manageItemsDialogRef} className="rounded-2xl border border-border bg-surface p-6 shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm w-full max-w-lg mx-auto">
                <div className="grid gap-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Kelola Unit: {currentCategory?.nama}</h3>
                            <p className="text-sm text-muted">Cari atau tambahkan unit fisik dengan 3 digit nomor urut.</p>
                        </div>
                        <button onClick={closeManageItemsDialog} className="text-muted hover:text-foreground transition-colors text-xl leading-none">&times;</button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono text-xs uppercase tracking-wider border-r border-border pr-2">
                                    {currentCategory?.prefix}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cari ID (001...)"
                                    value={lookupId}
                                    onChange={(e) => handleLookup(e.target.value.replace(/\D/g, "").slice(0, 3))}
                                    className="w-full pl-16 pr-3 py-2.5 bg-surface border border-border rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary/50 focus:outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleAddItem}
                                disabled={isPending || lookupId.length !== 3 || !!foundItem}
                                className={`${btnBase} ${btnPrimary} disabled:opacity-30`}
                                title="Tambah item baru dengan ID ini"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        {foundItem ? (
                            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Unit Ditemukan</p>
                                        <p className="text-sm font-mono font-bold text-foreground">{currentCategory?.prefix}-{foundItem.nomorUrut}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteItem(foundItem.id)}
                                        disabled={isPending}
                                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-muted mb-1.5">Kondisi</label>
                                        <select
                                            value={foundItem.kondisi}
                                            onChange={(e) => handleUpdateItem(foundItem.id, e.target.value as "BAIK" | "RUSAK", foundItem.isAvailable)}
                                            className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="BAIK">BAIK</option>
                                            <option value="RUSAK">RUSAK</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted mb-1.5">Status</label>
                                        <select
                                            value={foundItem.isAvailable ? "available" : "unavailable"}
                                            onChange={(e) => handleUpdateItem(foundItem.id, foundItem.kondisi, e.target.value === "available")}
                                            className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="available">Tersedia</option>
                                            <option value="unavailable">Tidak Tersedia</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ) : lookupId.length === 3 ? (
                            <div className="p-8 text-center border border-dashed border-border rounded-xl">
                                <p className="text-sm text-muted mb-3">Unit dengan ID <span className="font-mono font-bold text-foreground">{currentCategory?.prefix}-{lookupId}</span> tidak ditemukan.</p>
                                <button 
                                    onClick={() => {
                                        setNewItemNomorUrut(lookupId);
                                        handleAddItem();
                                    }}
                                    className={`${btnBase} ${btnOutline} text-xs gap-2`}
                                >
                                    <Plus className="h-3 w-3" />
                                    Buat Unit Baru
                                </button>
                            </div>
                        ) : (
                            <div className="p-8 text-center border border-dashed border-border rounded-xl opacity-50">
                                <p className="text-sm text-muted">Masukkan 3 digit nomor urut untuk melihat atau mengelola unit fisik.</p>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-xs font-medium bg-red-500/10 p-2 rounded-lg">{error}</p>}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button onClick={closeManageItemsDialog} className={`${btnBase} ${btnOutline} w-full sm:w-auto`}>Tutup</button>
                    </div>
                </div>
            </dialog>

            {/* Add/Edit Category Dialog */}
            <dialog ref={addEditDialogRef} className="rounded-2xl border border-border bg-surface p-6 shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm w-full max-w-lg mx-auto">
                <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-foreground">{currentCategory ? "Edit Kategori Aset" : "Tambah Kategori Aset Baru"}</h3>
                        <button onClick={closeAddEditDialog} className="text-muted hover:text-foreground transition-colors text-xl leading-none">&times;</button>
                    </div>
                    <p className="text-sm text-muted">{currentCategory ? "Ubah detail kategori aset." : "Tambahkan kategori baru untuk mengelompokkan item aset."}</p>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div>
                            <label htmlFor="categoryName" className="block text-sm font-medium text-foreground mb-1">Nama Kategori</label>
                            <input
                                type="text"
                                id="categoryName"
                                placeholder="Ex: Printer Epson L3110"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                disabled={isPending}
                                required
                                className="w-full border border-border bg-surface rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="categoryDescription" className="block text-sm font-medium text-foreground mb-1">Deskripsi</label>
                            <textarea
                                id="categoryDescription"
                                placeholder="Deskripsi Opsional"
                                value={categoryDescription || ""}
                                onChange={(e) => setCategoryDescription(e.target.value)}
                                disabled={isPending}
                                className="w-full border border-border bg-surface rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none min-h-[80px] resize-none"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={closeAddEditDialog} disabled={isPending} className={`${btnBase} ${btnOutline}`}>
                                Batal
                            </button>
                            <button type="submit" disabled={isPending} className={`${btnBase} ${btnPrimary}`}>
                                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {currentCategory ? "Simpan Perubahan" : "Tambah Kategori"}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>

            {/* Delete Confirmation Dialog */}
            <dialog ref={deleteDialogRef} className="rounded-2xl border border-border bg-surface p-6 shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm w-full max-w-md mx-auto">
                <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-foreground">Hapus Kategori Aset</h3>
                        <button onClick={closeDeleteDialog} className="text-muted hover:text-foreground transition-colors text-xl leading-none">&times;</button>
                    </div>
                    <p className="text-sm text-muted">
                        Apakah Anda yakin ingin menghapus kategori aset &quot;{currentCategory?.nama}&quot;?
                        Semua item aset fisik di bawah kategori ini juga akan terhapus secara permanen.
                    </p>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={closeDeleteDialog} disabled={isPending} className={`${btnBase} ${btnOutline}`}>
                            Batal
                        </button>
                        <button type="button" onClick={confirmDelete} disabled={isPending} className={`${btnBase} ${btnDestructive}`}>
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Hapus
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
}
