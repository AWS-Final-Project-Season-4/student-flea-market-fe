'use client';

import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, Download, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ProductItem, formatItemCodeDisplay } from '@/data/mock-items';
import { useLanguageStore } from '@/lib/language-store';

interface ItemQrCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductItem | null;
}

export const ItemQrCodeModal: React.FC<ItemQrCodeModalProps> = ({
    isOpen,
    onClose,
    product,
}) => {
    const [copied, setCopied] = useState(false);
    const { language } = useLanguageStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !product) return null;

    const formattedCode = formatItemCodeDisplay(product.itemCode);

    const handleCopy = () => {
        navigator.clipboard.writeText(formattedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const svgElement = document.getElementById('item-qr-svg');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 2; // high-resolution 2x
            canvas.width = 240 * scale;
            canvas.height = 240 * scale;
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
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 border border-[#EADBCE]">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F3EADF] text-[#8C7E74] hover:text-[#2A211B] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="text-center mb-5">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-[#C46A28] border border-amber-200/80 flex items-center justify-center mb-2.5 shadow-2xs">
                        <QrCode className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-[#2A211B]">
                        {language === 'vi' ? 'Mã QR Bàn Giao' : 'Handover QR Code'}
                    </h3>
                    <p className="text-xs text-[#7A6D63] mt-0.5 line-clamp-1">
                        {product.title}
                    </p>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-5 bg-[#FAF7F2] rounded-2xl border border-[#EADBCE] mb-4 shadow-inner">
                    <div className="bg-white p-3 rounded-xl shadow-xs border border-[#EADBCE]">
                        <QRCodeSVG
                            id="item-qr-svg"
                            value={product.itemCode}
                            size={180}
                            level="M"
                            fgColor="#2A211B"
                            bgColor="#FFFFFF"
                            includeMargin={false}
                        />
                    </div>

                    {/* Item Code Display with Copy */}
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wider text-[#7A6D63] font-semibold">
                            {language === 'vi' ? 'Mã hàng:' : 'Item Code:'}
                        </span>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#EADBCE] shadow-2xs">
                            <span className="font-mono font-bold text-sm tracking-widest text-[#2A211B]">
                                {formattedCode}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="p-1 rounded hover:bg-[#FAF7F2] text-[#8C7E74] hover:text-[#2A211B] transition-colors cursor-pointer"
                                title={language === 'vi' ? 'Sao chép mã' : 'Copy code'}
                            >
                                {copied ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="py-2.5 px-3 rounded-xl bg-white border border-[#EADBCE] hover:bg-[#FAF7F2] active:scale-98 text-[#2A211B] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{language === 'vi' ? 'Đã sao chép' : 'Copied'}</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5 text-[#8C7E74]" />
                                <span>{language === 'vi' ? 'Chép mã' : 'Copy Code'}</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleDownload}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Tải ảnh QR' : 'Save QR'}</span>
                    </button>
                </div>

                {/* Handover Notice */}
                <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-[#C46A28] shrink-0 mt-0.5" />
                    <span>
                        {language === 'vi'
                            ? 'Đưa mã QR này cho bên kia quét khi gặp mặt nhận đồ để xác nhận bàn giao 2 chiều tức thì.'
                            : 'Present this QR code during in-person meetup for instantaneous dual confirmation.'}
                    </span>
                </div>
            </div>
        </div>
    );
};

