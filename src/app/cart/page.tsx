
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore } from '@/lib/cart-store';

export default function CartPage() {
    const { user, isAuthenticated, isInitialized, initAuth } =
        useAuthStore();

    const carts = useCartStore((state) => state.carts);
    const removeFromCart = useCartStore((state) => state.removeFromCart);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [prevUserId, setPrevUserId] = useState(user?.id);

    if (prevUserId !== user?.id) {
        setPrevUserId(user?.id);
        setSelectedIds([]);
    }

    useEffect(() => {
        initAuth();
    }, [initAuth]);

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
        return total + price;
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

        alert(
            `Bạn đã chọn ${selectedItems.length} sản phẩm.\n` +
            `Tổng tiền: ${totalPrice.toLocaleString('vi-VN')} VND`
        );
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

                                    <img
                                        src={product.imageUrl}
                                        alt={product.title}
                                        className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 object-cover rounded-xl"
                                    />

                                    <div className="flex-1 min-w-0">

                                        <h2 className="font-bold truncate">
                                            {product.title}
                                        </h2>

                                        <p className="text-sm text-stone-500 mt-1">
                                            {product.location}
                                        </p>

                                        <p className="font-bold text-[#7D5435] dark:text-[#E5C9A8] mt-2">
                                            {product.price}
                                        </p>

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

        </div>
    );
}
