'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    X,
    MessageSquare,
    MapPin,
    Check,
    Copy,
    QrCode,
    ChevronDown,
    ChevronUp,
    Download,
    Loader2,
    AlertCircle,
    ArrowRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ProductItem, formatItemCodeDisplay } from '@/data/mock-items';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';
import { chatApi } from '@/lib/chat-api';

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
    const [copiedCode, setCopiedCode] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [isStartingChat, setIsStartingChat] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const { language } = useLanguageStore();
    const t = DICTIONARY[language];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setChatError(null);
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

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

    const handleDownloadQr = () => {
        const svgElement = document.getElementById('seller-modal-qr-svg');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 2;
            canvas.width = 200 * scale;
            canvas.height = 200 * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `SFM-${product.itemCode}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(svgUrl);
        };
        img.src = svgUrl;
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
                <div className="bg-[#FAF7F2] dark:bg-stone-800/70 border border-[#EADBCE] dark:border-stone-700 rounded-2xl p-3 flex items-center gap-3 mb-3">
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

                {/* QR Code Handover Toggle Box */}
                {product.itemCode && (
                    <div className="mb-4 rounded-2xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2]/60 dark:bg-stone-800/50 overflow-hidden transition-all">
                        <button
                            type="button"
                            onClick={() => setShowQr(!showQr)}
                            className="w-full p-2.5 px-3.5 flex items-center justify-between text-xs font-semibold text-[#2A211B] dark:text-stone-100 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2 text-[#C46A28] dark:text-[#F5A764]">
                                <QrCode className="w-4 h-4" />
                                <span>{language === 'vi' ? 'Mã QR bàn giao & đối soát' : 'Handover QR & Verification'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-[#7A6D63] dark:text-stone-400">
                                <span>{showQr ? (language === 'vi' ? 'Thu gọn' : 'Collapse') : (language === 'vi' ? 'Hiển thị' : 'Show')}</span>
                                {showQr ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                        </button>

                        {showQr && (
                            <div className="p-4 pt-1 bg-white dark:bg-stone-900 border-t border-[#EADBCE] dark:border-stone-700 flex flex-col items-center animate-in fade-in duration-200">
                                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EADBCE] shadow-2xs mt-2">
                                    <QRCodeSVG
                                        id="seller-modal-qr-svg"
                                        value={product.itemCode}
                                        size={140}
                                        level="M"
                                        fgColor="#2A211B"
                                        bgColor="#FFFFFF"
                                    />
                                </div>
                                <div className="mt-2 text-center">
                                    <span className="font-mono font-bold text-xs tracking-widest text-[#2A211B] dark:text-stone-100">
                                        {formattedCode}
                                    </span>
                                    <p className="text-[10px] text-[#7A6D63] dark:text-stone-400 mt-0.5">
                                        {language === 'vi'
                                            ? 'Quét mã để xác nhận đã nhận đúng đồ khi gặp mặt trao đổi'
                                            : 'Scan this QR to verify item handover upon meetup'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDownloadQr}
                                    className="mt-2.5 px-3 py-1 rounded-lg bg-[#FAF7F2] dark:bg-stone-800 hover:bg-[#F3EADF] dark:hover:bg-stone-700 border border-[#EADBCE] dark:border-stone-700 text-[11px] font-semibold text-[#2A211B] dark:text-stone-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Download className="w-3 h-3 text-[#A8744F] dark:text-[#F5A764]" />
                                    <span>{language === 'vi' ? 'Lưu mã QR' : 'Save QR'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

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

                {/* Safety Tips Footer */}
                <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2 leading-relaxed">
                    <span className="text-[#C46A28] dark:text-[#F5A764] font-bold shrink-0">
                        💡 {language === 'vi' ? 'Mẹo an toàn:' : 'Safety Tip:'}
                    </span>
                    <span>
                        {language === 'vi'
                            ? 'Luôn trao đổi rõ tình trạng đồ trong khung chat và gặp trực tiếp tại nơi công cộng để kiểm tra món đồ trước khi thanh toán.'
                            : 'Discuss item details in chat and meet in public areas to inspect the item before payment.'}
                    </span>
                </div>
            </div>
        </div>
    );
};
