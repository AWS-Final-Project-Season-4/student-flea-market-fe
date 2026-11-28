
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ArrowLeft, Loader2, X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';
import { itemsApi } from '@/lib/items-api';
import { transactionsApi } from '@/lib/transactions-api';

export default function CartPage() {
    const router = useRouter();
    const { user, isAuthenticated, isInitialized, initAuth } =
        useAuthStore();

    const carts = useCartStore((state) => state.carts);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeFromCart = useCartStore((state) => state.removeFromCart);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [prevUserId, setPrevUserId] = useState(user?.id);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [cleanupNotice, setCleanupNotice] = useState<string | null>(null);

    if (prevUserId !== user?.id) {
        setPrevUserId(user?.id);
        setSelectedIds([]);
    }

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    useEffect(() => {
        if (!isAuthenticated || !user) return;
        const currentItems = useCartStore.getState().carts[user.id] ?? [];
        if (currentItems.length === 0) return;

        let cancelled = false;

        Promise.allSettled(
            currentItems.map(async (cartItem) => {
                try {
                    const detail = await itemsApi.getItemById(cartItem.id);
                    const unavailable = detail.status !== 1 || (detail.quantity ?? 1) <= 0;
                    return { id: cartItem.id, remove: unavailable, maxQty: detail.quantity ?? 1 };
                } catch (err: unknown) {
                    const status = (err as { response?: { status?: number } })?.response?.status;
                    return { id: cartItem.id, remove: status === 404, maxQty: cartItem.quantity ?? 1 };
                }
            })
        ).then((results) => {
            if (cancelled) return;
            let removedCount = 0;
            for (const r of results) {
                if (r.status === 'fulfilled') {
                    if (r.value.remove) {
                        removeFromCart(user.id, r.value.id);
                        setSelectedIds((prev) => prev.filter((id) => id !== r.value.id));
                        removedCount++;
                    } else {
                        const existing = useCartStore
                            .getState()
                            .carts[user.id]?.find((x) => x.id === r.value.id);
                        if (existing && (existing.selectedQuantity ?? 1) > r.value.maxQty) {
                            updateQuantity(user.id, r.value.id, r.value.maxQty);
                        }
                    }
                }
            }
            if (removedCount > 0) {
                setCleanupNotice(
                    `Đã tự động dọn ${removedCount} sản phẩm đã bán / hết hàng khỏi giỏ hàng.`
                );
            }
        });

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user, removeFromCart, updateQuantity]);

    const items = isAuthenticated && user
        ? carts[user.id] ?? []
        : [];

    const selectedItems = items.filter((item) =>
        selectedIds.includes(item.id)
    );

    const allSelected =
        items.length > 0 && selectedItems.length === items.length;

    const totalPrice = selectedItems.reduce((total, item) => {
        const price = Number(item.price.replace(/[^0-9]/g, ''));
        const qty = item.selectedQuantity ?? 1;
        return total + price * qty;
    }, 0);

    const toggleSelect = (productId: string) => {
        setSelectedIds((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    const toggleSelectAll = () => {
        setSelectedIds(
            allSelected ? [] : items.map((item) => item.id)
        );
    };

    const handleRemove = (productId: string) => {
        if (!user) return;

        removeFromCart(user.id, productId);

        setSelectedIds((prev) =>
            prev.filter((id) => id !== productId)
        );
    };

    const handleCheckout = () => {
        if (selectedItems.length === 0) return;
        setCheckoutError(null);
        setIsCheckoutOpen(true);
    };

    const handleConfirmCheckout = async () => {
        if (!user || selectedItems.length === 0 || isSubmittingCheckout) return;
        setCheckoutError(null);
        setIsSubmittingCheckout(true);

        try {
            for (const item of selectedItems) {
                if (!item.itemCode) {
                    throw new Error(`Sản phẩm "${item.title}" thiếu mã hàng, vui lòng xóa và thêm lại.`);
                }
                await transactionsApi.createPurchaseDirect({
                    itemCode: item.itemCode,
                    quantity: item.selectedQuantity ?? 1,
                    meetingLocation: item.location,
                    paymentMethod: 1,
                });
                removeFromCart(user.id, item.id);
                setSelectedIds((prev) => prev.filter((id) => id !== item.id));
            }
            setIsCheckoutOpen(false);
            router.push('/transactions');
        } catch (err: unknown) {
            const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
            setCheckoutError(
                apiErr?.response?.data?.message ||
                apiErr?.message ||
                'Không thể tạo đơn hàng. Vui lòng thử lại.'
            );
        } finally {
            setIsSubmittingCheckout(false);
        }
    };

    if (!isInitialized) {
        return <div className="p-10 text-center">Đang tải...</div>;
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h1 className="text-xl font-bold">
                    Vui lòng đăng nhập để xem giỏ hàng
                </h1>

                <Link href="/login" className="underline">
                    Đăng nhập
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FCF9F4] dark:bg-stone-950 text-[#3D2B1F] dark:text-stone-100">

            <main className="max-w-5xl mx-auto px-4 py-8 pb-40">

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 mb-6 hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Tiếp tục mua sắm
                </Link>

                <h1 className="text-3xl font-bold flex items-center gap-3 mb-8">
                    <ShoppingCart className="w-8 h-8" />
                    Giỏ hàng ({items.length})
                </h1>

                {cleanupNotice && (
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
                        <span>{cleanupNotice}</span>
                        <button
                            type="button"
                            onClick={() => setCleanupNotice(null)}
                            className="font-semibold hover:underline cursor-pointer"
                        >
                            Đóng
                        </button>
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="bg-white dark:bg-stone-900 rounded-2xl p-12 text-center">

                        <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-40" />

                        <h2 className="text-xl font-semibold mb-2">
                            Giỏ hàng đang trống
                        </h2>

                        <p className="text-stone-500 mb-6">
                            Hãy thêm sản phẩm bạn yêu thích vào giỏ hàng.
                        </p>

                        <Link
                            href="/"
                            className="inline-block px-6 py-3 rounded-xl bg-[#DFC9AE] text-[#3D2B1F] font-semibold"
                        >
                            Mua sắm ngay
                        </Link>

                    </div>
                ) : (
                    <>
                        {/* Chọn tất cả */}
                        <div className="flex items-center gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 mb-4">

                            <input
                                id="select-all"
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="w-5 h-5 accent-[#855A3C] cursor-pointer"
                            />

                            <label
                                htmlFor="select-all"
                                className="font-semibold cursor-pointer"
                            >
                                Chọn tất cả ({items.length} sản phẩm)
                            </label>

                        </div>

                        {/* Danh sách sản phẩm */}
                        <div className="space-y-4">

                            {items.map((product) => (
                                <div
                                    key={product.id}
                                    className={`flex items-center gap-3 sm:gap-4 bg-white dark:bg-stone-900 border rounded-2xl p-4 transition-colors ${
                                        selectedIds.includes(product.id)
                                            ? 'border-[#B88A60]'
                                            : 'border-stone-200 dark:border-stone-800'
                                    }`}
                                >

                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(product.id)}
                                        onChange={() => toggleSelect(product.id)}
                                        aria-label={`Chọn ${product.title}`}
                                        className="w-5 h-5 shrink-0 accent-[#855A3C] cursor-pointer"
                                    />

                                    <Link href={`/items/${product.id}`} className="shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={product.imageUrl}
                                            alt={product.title}
                                            className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-xl"
                                        />
                                    </Link>

                                    <div className="flex-1 min-w-0">

                                        <Link href={`/items/${product.id}`} className="hover:underline">
                                            <h2 className="font-bold truncate">
                                                {product.title}
                                            </h2>
                                        </Link>

                                        <p className="text-sm text-stone-500 mt-1">
                                            {product.location}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                            <p className="font-bold text-[#7D5435] dark:text-[#E5C9A8]">
                                                {product.price}
                                            </p>
                                            <div className="inline-flex items-center border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQuantity(
                                                            user.id,
                                                            product.id,
                                                            Math.max(1, (product.selectedQuantity ?? 1) - 1)
                                                        )
                                                    }
                                                    aria-label={`Giảm số lượng ${product.title}`}
                                                    className="px-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                                                >
                                                    -
                                                </button>
                                                <span className="px-2.5 py-1 font-semibold tabular-nums">
                                                    {product.selectedQuantity ?? 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateQuantity(
                                                            user.id,
                                                            product.id,
                                                            Math.min(
                                                                product.quantity ?? 999,
                                                                (product.selectedQuantity ?? 1) + 1
                                                            )
                                                        )
                                                    }
                                                    aria-label={`Tăng số lượng ${product.title}`}
                                                    className="px-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemove(product.id)}
                                        title="Xóa sản phẩm"
                                        aria-label={`Xóa ${product.title}`}
                                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-stone-800 rounded-xl cursor-pointer"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>

                                </div>
                            ))}

                        </div>

                        {/* Thanh tổng tiền và mua hàng */}
                        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-stone-900 border-t border-[#EADBCE] dark:border-stone-800 shadow-lg">

                            <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">

                                <label className="flex items-center gap-2 cursor-pointer">

                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="w-5 h-5 accent-[#855A3C] cursor-pointer"
                                    />

                                    <span className="text-sm font-medium">
                                        Chọn tất cả ({items.length})
                                    </span>

                                </label>

                                <div className="flex flex-wrap items-center gap-4">

                                    <div className="text-right">

                                        <p className="text-sm text-stone-500 dark:text-stone-400">
                                            Tổng tiền ({selectedItems.length} sản phẩm)
                                        </p>

                                        <p className="text-xl sm:text-2xl font-bold text-[#855A3C] dark:text-[#E5C9A8]">
                                            {totalPrice.toLocaleString('vi-VN')} VND
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCheckout}
                                        disabled={selectedItems.length === 0}
                                        className="px-6 py-3 rounded-xl bg-[#855A3C] hover:bg-[#6D482E] text-white font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Mua hàng ({selectedItems.length})
                                    </button>

                                </div>

                            </div>

                        </div>

                    </>
                )}

            </main>

            {/* Modal Xác nhận đặt mua từ Giỏ hàng (giống Mua ngay) */}
            {isCheckoutOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
                    <div className="bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
                        <button
                            type="button"
                            onClick={() => setIsCheckoutOpen(false)}
                            aria-label="Đóng"
                            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <h2 className="font-serif text-xl font-bold mb-1">
                            Xác nhận đặt mua ({selectedItems.length} sản phẩm)
                        </h2>
                        <p className="text-xs text-[#6D5D52] dark:text-stone-400 mb-4">
                            Đơn giao dịch sẽ được gửi tới người bán và theo dõi tại trang Giao dịch.
                        </p>

                        <div className="rounded-2xl bg-[#FAF7F2] dark:bg-stone-800/70 border border-[#EADBCE] dark:border-stone-700 p-3.5 space-y-2.5 mb-4 text-xs max-h-56 overflow-y-auto">
                            {selectedItems.map((item) => {
                                const unitPrice = Number(item.price.replace(/[^0-9]/g, ''));
                                const qty = item.selectedQuantity ?? 1;
                                const lineTotal = unitPrice * qty;
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-start justify-between gap-3 pb-2 border-b border-[#EADBCE]/60 dark:border-stone-700/60 last:border-b-0 last:pb-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-semibold truncate">{item.title}</p>
                                            <p className="text-[11px] text-[#6D5D52] dark:text-stone-400 truncate">
                                                Location: {item.location} • SL: x{qty}
                                            </p>
                                        </div>
                                        <span className="font-bold text-[#C46A28] dark:text-[#F5A764] shrink-0 tabular-nums">
                                            {lineTotal === 0
                                                ? 'Miễn phí'
                                                : `${lineTotal.toLocaleString('vi-VN')} ₫`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-center px-1 mb-3">
                            <span className="text-xs font-semibold text-[#6D5D52] dark:text-stone-300">
                                Tổng tiền hàng:
                            </span>
                            <span className="text-lg font-extrabold text-[#C46A28] dark:text-[#F5A764] tabular-nums">
                                {totalPrice === 0
                                    ? '0 VND (Miễn phí)'
                                    : `${totalPrice.toLocaleString('vi-VN')} ₫`}
                            </span>
                        </div>

                        <p className="text-[11px] text-[#6D5D52] dark:text-stone-400 mb-3 leading-relaxed">
                            Hình thức giao nhận (gặp trực tiếp hay đặt ship ngoài) và điểm hẹn cuối cùng sẽ do người bán chọn &amp; cập nhật trên đơn sau khi hai bên chốt qua chat.
                        </p>

                        <div className="mb-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                            <p className="font-bold mb-0.5">
                                Thanh toán khi đồng kiểm &amp; nhận hàng (COD / VietQR)
                            </p>
                            <p className="text-[11px] opacity-90">
                                Sau khi nhận và kiểm tra hàng OK, bạn có thể trả tiền mặt hoặc quét mã VietQR ngay trên đơn để chuyển khoản cho người bán rồi chụp ảnh bill gửi xác nhận.
                            </p>
                        </div>

                        {checkoutError && (
                            <div className="mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300">
                                {checkoutError}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCheckoutOpen(false)}
                                className="flex-1 py-2.5 rounded-xl border border-[#EADBCE] dark:border-stone-700 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={isSubmittingCheckout}
                                onClick={() => void handleConfirmCheckout()}
                                className="flex-1 py-2.5 rounded-xl bg-[#C46A28] hover:bg-[#A65A24] text-white dark:bg-[#F5A764] dark:hover:bg-[#E89650] dark:text-stone-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                                {isSubmittingCheckout && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>Xác nhận mua hàng</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
