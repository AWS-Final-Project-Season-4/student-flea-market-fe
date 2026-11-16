'use client';

import React, { useState } from 'react';
import { X, Zap, Flame, Crown, QrCode, CheckCircle2, ArrowRight, Plus, AlertCircle } from 'lucide-react';
import { ProductItem } from '@/data/mock-items';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';

interface AdPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userItems?: ProductItem[];
  onOpenPostItem?: () => void;
}

export const AdPromotionModal: React.FC<AdPromotionModalProps> = ({
  isOpen,
  onClose,
  userItems = [],
  onOpenPostItem,
}) => {
  const { language } = useLanguageStore();
  const t = DICTIONARY[language];

  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<'pkg1' | 'pkg2' | 'pkg3'>('pkg1');
  const [step, setStep] = useState<'choose' | 'pay' | 'success'>('choose');

  if (!isOpen) return null;

  const myItems = userItems.slice(0, 8);
  const currentPkgPrice =
    selectedPackage === 'pkg1'
      ? t.adPromotionModal.pkg1Price
      : selectedPackage === 'pkg2'
      ? t.adPromotionModal.pkg2Price
      : t.adPromotionModal.pkg3Price;

  const currentPkgTitle =
    selectedPackage === 'pkg1'
      ? t.adPromotionModal.pkg1Title
      : selectedPackage === 'pkg2'
      ? t.adPromotionModal.pkg2Title
      : t.adPromotionModal.pkg3Title;

  const handleActivate = () => {
    setStep('success');
    setTimeout(() => {
      setStep('choose');
      onClose();
    }, 2500);
  };

  const handleClose = () => {
    setStep('choose');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button - Only exits when clicked */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'success' ? (
          <div className="py-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-xs animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {language === 'vi' ? 'Đã kích hoạt quảng cáo thành công!' : 'Boost Activated Successfully!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mb-4">
              {t.adPromotionModal.successToast}
            </p>
            <div className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold">
              <span>{language === 'vi' ? `Gói áp dụng: ${currentPkgTitle}` : `Package: ${currentPkgTitle}`}</span>
            </div>
          </div>
        ) : step === 'pay' ? (
          /* Step 2: Payment via QR code */
          <div className="py-2 text-center animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {t.adPromotionModal.momoVnpay}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              {language === 'vi'
                ? `Phí dịch vụ đẩy tin: ${currentPkgPrice}`
                : `Total promotion fee: ${currentPkgPrice}`}
            </p>

            {/* QR Code Canvas Frame */}
            <div className="w-52 h-52 mx-auto p-3.5 bg-white border-2 border-dashed border-amber-400 rounded-2xl flex flex-col items-center justify-center shadow-xs">
              <div className="w-full h-full bg-slate-50 rounded-xl flex flex-col items-center justify-center p-3 text-slate-500 border border-slate-100">
                <QrCode className="w-20 h-20 text-slate-800 mb-2" />
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  MoMo / VNPay QR
                </span>
                <span className="text-[10px] font-semibold text-slate-600 mt-0.5 font-mono">
                  {currentPkgPrice}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-3 mb-5 leading-relaxed">
              {language === 'vi'
                ? 'Mở ứng dụng Ngân hàng hoặc ví MoMo để quét mã thanh toán. Tin đăng sẽ được ghim top ngay sau khi thanh toán.'
                : 'Scan via Banking app or MoMo wallet to activate instantly. Your listing will be featured immediately.'}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="w-1/3 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
              >
                {language === 'vi' ? 'Quay lại' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleActivate}
                className="w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                {language === 'vi' ? 'Xác nhận đã thanh toán' : 'Confirm & Activate'}
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: Select Item and Choose Package */
          <>
            {/* Header */}
            <div className="mb-5">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-2">
                <span>{language === 'vi' ? '⚡ Dịch vụ có phí • Đẩy tin bán gấp' : '⚡ Paid Service • Listing Boost'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t.adPromotionModal.title}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                {t.adPromotionModal.subtitle}
              </p>
            </div>

            {/* If user has no items on the market */}
            {myItems.length === 0 ? (
              <div className="py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  {language === 'vi' ? 'Bạn chưa có tin đăng nào' : 'No listings available'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
                  {language === 'vi'
                    ? 'Bạn cần đăng món đồ lên sàn trước (hoàn toàn miễn phí), sau đó mới có thể chọn món đồ để đẩy tin bán gấp.'
                    : 'You need to list an item first (free of charge), then you can boost it to trending.'}
                </p>
                {onOpenPostItem && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onOpenPostItem();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-xs shadow-xs hover:shadow-md transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Đăng món đồ miễn phí ngay' : 'Post Free Item Now'}</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Step 1: Select Item to Boost */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                    {t.adPromotionModal.selectItem}
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {myItems.map((item, idx) => {
                      const isSelected = selectedItemIndex === idx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItemIndex(idx)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-orange-600">
                                  {item.price}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {item.itemCode}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Choose Boost Package */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                    {t.adPromotionModal.choosePackage}
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Pkg 1: 24h Urgent */}
                    <div
                      onClick={() => setSelectedPackage('pkg1')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedPackage === 'pkg1'
                          ? 'border-amber-500 bg-amber-50/40 shadow-xs ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                          <Zap className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              {t.adPromotionModal.pkg1Title}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white">
                              ⚡ BÁN GẤP
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {t.adPromotionModal.pkg1Desc}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-orange-600 shrink-0 ml-2">
                        {t.adPromotionModal.pkg1Price}
                      </span>
                    </div>

                    {/* Pkg 2: 3-Day Trending */}
                    <div
                      onClick={() => setSelectedPackage('pkg2')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedPackage === 'pkg2'
                          ? 'border-amber-500 bg-amber-50/40 shadow-xs ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                          <Flame className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              {t.adPromotionModal.pkg2Title}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">
                              🔥 HOT DEAL
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {t.adPromotionModal.pkg2Desc}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-orange-600 shrink-0 ml-2">
                        {t.adPromotionModal.pkg2Price}
                      </span>
                    </div>

                    {/* Pkg 3: 7-Day VIP */}
                    <div
                      onClick={() => setSelectedPackage('pkg3')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedPackage === 'pkg3'
                          ? 'border-amber-500 bg-amber-50/40 shadow-xs ring-1 ring-amber-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                          <Crown className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              {t.adPromotionModal.pkg3Title}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                              💎 VIP
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {t.adPromotionModal.pkg3Desc}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-orange-600 shrink-0 ml-2">
                        {t.adPromotionModal.pkg3Price}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-1/3 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
                  >
                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('pay')}
                    className="w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{t.adPromotionModal.activateBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
