'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    X,
    MessageSquare,
    MapPin,
    Check,
    Copy,
    Loader2,
    AlertCircle,
    ArrowRight,
} from 'lucide-react';
import { ProductItem, formatItemCodeDisplay } from '@/data/mock-items';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';
import { chatApi } from '@/lib/chat-api';
import AddressPicker from './AddressPicker';
import type { AddressPosition } from './AddressMap';

interface SellerContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductItem | null;
}

export const SellerContactModal: React.FC<SellerContactModalProps> = ({
    isOpen,
    onClose,
    product,
}) => {
    const router = useRouter();
    const [address, setAddress] = useState('');
    const [addressPosition, setAddressPosition] = useState<AddressPosition | null>(null);
    const [editingAddress, setEditingAddress] = useState(false);
    const [prevContextKey, setPrevContextKey] = useState(`${product?.id ?? ''}-${isOpen}`);

    const currentContextKey = `${product?.id ?? ''}-${isOpen}`;
    if (prevContextKey !== currentContextKey) {
        setPrevContextKey(currentContextKey);
        setAddress('');
        setAddressPosition(null);
        setEditingAddress(false);
    }

    const [copiedCode, setCopiedCode] = useState(false);
    const [isStartingChat, setIsStartingChat] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const { language } = useLanguageStore();
    const t = DICTIONARY[language];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (editingAddress) { setEditingAddress(false); return; }
                setChatError(null);
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, editingAddress]);

    if (!isOpen || !product) return null;

    const formattedCode = formatItemCodeDisplay(product.itemCode);

    const handleClose = () => {
        setChatError(null);
        setIsStartingChat(false);
        onClose();
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(formattedCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleStartChat = async () => {
        setChatError(null);
        setIsStartingChat(true);
        try {
            const conv = await chatApi.getOrCreateConversation(product.id);
            handleClose();
            router.push(`/chat?c=${encodeURIComponent(conv.id)}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unable to start chat conversation.';
            setChatError(msg);
        } finally {
            setIsStartingChat(false);
        }
    };

    const handleShareAddress = async () => {
        if (!address.trim() || isStartingChat) return;

        setChatError(null);
        setIsStartingChat(true);

        try {
            const conv = await chatApi.getOrCreateConversation(product.id);

            const query = addressPosition
                ? `${addressPosition.lat},${addressPosition.lng}`
                : address;

            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

            const message = language === 'vi'
                ? `Địa chỉ giao nhận đề xuất: ${address}\nGoogle Maps: ${mapUrl}`
                : `Proposed handover address: ${address}\nGoogle Maps: ${mapUrl}`;

            await chatApi.sendMessageRest(conv.id, message);

            handleClose();
            router.push(`/chat?c=${encodeURIComponent(conv.id)}`);
        } catch (err: unknown) {
            setChatError(
                err instanceof Error
                    ? err.message
                    : 'Unable to share address.'
            );
        } finally {
            setIsStartingChat(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 border border-[#EADBCE] dark:border-stone-800 max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F2] dark:bg-stone-800 hover:bg-[#F3EADF] dark:hover:bg-stone-700 text-[#8C7E74] hover:text-[#2A211B] dark:hover:text-stone-100 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-[#C46A28] dark:text-[#F5A764] border border-amber-200/80 dark:border-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-serif font-bold text-[#2A211B] dark:text-stone-100 leading-tight">
                            {t.sellerContact.title}
                        </h3>
                        <p className="text-xs text-[#7A6D63] dark:text-stone-400 mt-0.5">
                            {t.sellerContact.subtitle}
                        </p>
                    </div>
                </div>

                {/* Product Summary */}
                <div className="bg-[#FAF7F2] dark:bg-stone-800/70 border border-[#EADBCE] dark:border-stone-700 rounded-2xl p-3 flex items-center gap-3 mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700"
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs sm:text-sm text-[#2A211B] dark:text-stone-100 truncate">
                            {product.title}
                        </h4>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                            <span className="text-sm font-bold text-[#C46A28] dark:text-[#F5A764]">
                                {product.price}
                            </span>
                            {/* Item Code Badge */}
                            {product.itemCode && (
                                <button
                                    type="button"
                                    onClick={handleCopyCode}
                                    title={language === 'vi' ? 'Bấm để chép mã' : 'Click to copy code'}
                                    className="font-mono text-[10px] font-bold text-[#A8744F] dark:text-[#F5A764] bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 hover:border-[#C46A28] px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                >
                                    <span>{formattedCode}</span>
                                    {copiedCode ? (
                                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="w-2.5 h-2.5 text-[#8C7E74]" />
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#7A6D63] dark:text-stone-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#A8744F] dark:text-[#F5A764] shrink-0" />
                            <span className="truncate">{product.location}</span>
                        </div>
                    </div>
                </div>

                {/* Delivery / meetup address */}
                <div className="mb-4 rounded-2xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-800/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#2A211B] dark:text-stone-100">
                            <MapPin className="w-4 h-4 text-[#C46A28] dark:text-[#F5A764]" />
                            {language === 'vi' ? 'Địa chỉ giao nhận' : 'Handover address'}
                        </div>
                        <button
                            type="button"
                            onClick={() => setEditingAddress(true)}
                            className="text-xs font-semibold text-[#A65A24] dark:text-[#F5A764] border border-[#EADBCE] dark:border-stone-600 rounded-lg px-2.5 py-1.5 cursor-pointer"
                        >
                            {address
                                ? (language === 'vi' ? 'Thay đổi' : 'Change')
                                : (language === 'vi' ? '+ Nhập địa chỉ' : '+ Add address')}
                        </button>
                    </div>
                    {address ? (
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressPosition ? `${addressPosition.lat},${addressPosition.lng}` : address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-2 text-xs underline underline-offset-2 break-words text-[#A65A24] dark:text-[#F5A764]"
                        >
                            {address}
                        </a>
                    ) : (
                        <p className="mt-2 text-[11px] text-[#7A6D63] dark:text-stone-400">
                            {language === 'vi' ? 'Chưa nhập địa chỉ giao nhận.' : 'No handover address entered.'}
                        </p>
                    )}
                    {address && !editingAddress && (
                        <button
                            type="button"
                            disabled={isStartingChat}
                            onClick={() => void handleShareAddress()}
                            className="mt-3 w-full rounded-xl border border-[#A65A24] px-3 py-2 text-xs font-semibold text-[#A65A24] dark:text-[#F5A764] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <MessageSquare className="w-4 h-4" />
                            {language === 'vi'
                                ? 'Chia sẻ địa chỉ với người bán'
                                : 'Share address with seller'}
                        </button>
                    )}
                    {editingAddress && (
                        <AddressPicker
                            initialAddress={address}
                            initialPosition={addressPosition}
                            language={language}
                            onCancel={() => setEditingAddress(false)}
                            onConfirm={(value) => {
                                setAddress(value.address);
                                setAddressPosition(value.position);
                                setEditingAddress(false);
                            }}
                        />
                    )}
                </div>

                {/* Error Notice */}
                {chatError && (
                    <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{chatError}</span>
                    </div>
                )}

                {/* Real-time In-App Chat CTA */}
                <div className="mb-4 space-y-2.5">
                    <button
                        type="button"
                        disabled={isStartingChat}
                        onClick={() => void handleStartChat()}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E89650] to-[#F5A764] hover:from-[#DC833B] hover:to-[#EC954B] active:scale-99 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
                    >
                        {isStartingChat ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>
                                    {language === 'vi'
                                        ? 'Đang mở cuộc trò chuyện...'
                                        : 'Opening conversation...'}
                                </span>
                            </>
                        ) : (
                            <>
                                <MessageSquare className="w-4 h-4" />
                                <span>
                                    {language === 'vi'
                                        ? 'Nhắn tin ngay với Người bán'
                                        : 'Chat with Seller Now'}
                                </span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                    <p className="text-[11px] text-center text-[#7A6D63] dark:text-stone-400">
                        {language === 'vi'
                            ? 'Trò chuyện trực tiếp ngay trên sàn — không lộ số điện thoại cá nhân.'
                            : 'Real-time in-app messaging — keeps your personal phone private.'}
                    </p>
                </div>
            </div>
        </div>
    );
};
