'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Flag, Loader2, X } from 'lucide-react';
import { MessageDto } from '@/types/chat';

interface ReportReasonOption {
  value: number;
  labelVi: string;
  labelEn: string;
}

const REPORT_REASONS: ReportReasonOption[] = [
  { value: 4, labelVi: 'Quấy rối, xúc phạm', labelEn: 'Harassment / Abusive language' },
  { value: 5, labelVi: 'Lừa đảo, giả mạo', labelEn: 'Scam / Impersonation' },
  { value: 6, labelVi: 'Thông tin sai sự thật', labelEn: 'False / Misleading info' },
  { value: 1, labelVi: 'Bùng hàng / Hẹn không tới', labelEn: 'No-show / Canceling meetup' },
  { value: 7, labelVi: 'Vi phạm khác', labelEn: 'Other violation' },
];

interface ReportMessageModalProps {
  message: MessageDto | null;
  otherPartyName: string;
  isVi: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    messageId: string;
    reason: number;
    description: string;
  }) => Promise<void>;
}

export const ReportMessageModal: React.FC<ReportMessageModalProps> = ({
  message,
  otherPartyName,
  isVi,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState<number>(4);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [prevMessageId, setPrevMessageId] = useState<string | null>(message?.id ?? null);

  const currentMessageId = message?.id ?? null;
  if (prevMessageId !== currentMessageId) {
    setPrevMessageId(currentMessageId);
    setReason(4);
    setDescription('');
    setErrorMsg(null);
    setIsSubmitting(false);
  }

  useEffect(() => {
    if (!message) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [message, onClose, isSubmitting]);

  if (!message) return null;

  const trimmed = description.trim();
  const canSubmit = trimmed.length >= 10 && trimmed.length <= 1000 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setErrorMsg(
        isVi
          ? 'Vui lòng mô tả lý do báo cáo tối thiểu 10 ký tự.'
          : 'Please enter at least 10 characters explaining the issue.'
      );
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        messageId: message.id,
        reason,
        description: trimmed,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : isVi
            ? 'Không thể gửi báo cáo tin nhắn này.'
            : 'Unable to submit message report.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-message-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-800 p-5 sm:p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label={isVi ? 'Đóng' : 'Close'}
          className="absolute top-4 right-4 min-h-[36px] min-w-[36px] rounded-full bg-[#FAF7F2] dark:bg-stone-800 hover:bg-[#F3EADF] dark:hover:bg-stone-700 text-[#6D5D52] dark:text-stone-300 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="report-message-modal-title"
              className="text-base font-bold text-[#2A211B] dark:text-stone-100"
            >
              {isVi ? 'Báo cáo tin nhắn vi phạm' : 'Report message'}
            </h3>
            <p className="text-xs text-[#6D5D52] dark:text-stone-400">
              {isVi
                ? `Gửi bằng chứng tin nhắn của ${otherPartyName} để kiểm duyệt viên xử lý.`
                : `Submit message evidence from ${otherPartyName} for moderator review.`}
            </p>
          </div>
        </div>

        {/* Quoted offending message evidence */}
        <div className="mb-4 rounded-2xl bg-[#FAF7F2] dark:bg-stone-800 border border-[#EADBCE] dark:border-stone-700 p-3 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#A65A24] dark:text-[#F5A764]">
            {isVi ? 'Bằng chứng tin nhắn' : 'Message evidence'}
          </p>
          <p className="text-xs text-[#2A211B] dark:text-stone-100 break-words line-clamp-4">
            &ldquo;{message.content}&rdquo;
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold text-[#2A211B] dark:text-stone-100 mb-1">
              {isVi ? 'Lý do báo cáo' : 'Reason'}
            </legend>
            <div className="grid grid-cols-1 gap-1.5">
              {REPORT_REASONS.map((opt) => {
                const checked = reason === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs cursor-pointer transition ${
                      checked
                        ? 'bg-[#FAF7F2] dark:bg-stone-800 border-[#C46A28] dark:border-[#F5A764] text-[#2A211B] dark:text-stone-100 font-semibold'
                        : 'bg-white dark:bg-stone-900 border-[#EADBCE] dark:border-stone-700 text-[#6D5D52] dark:text-stone-300 hover:bg-[#FAF7F2]/60 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={opt.value}
                      checked={checked}
                      onChange={() => setReason(opt.value)}
                      className="accent-[#C46A28]"
                    />
                    <span>{isVi ? opt.labelVi : opt.labelEn}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label
              htmlFor="report-message-desc"
              className="block text-xs font-semibold text-[#2A211B] dark:text-stone-100"
            >
              {isVi ? 'Mô tả chi tiết (tối thiểu 10 ký tự)' : 'Details (min 10 characters)'}
            </label>
            <textarea
              id="report-message-desc"
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isVi
                  ? 'Mô tả hành vi vi phạm hoặc ngữ cảnh của tin nhắn này...'
                  : 'Describe the violation or context for this message...'
              }
              className="w-full rounded-2xl border border-[#EADBCE] dark:border-stone-700 bg-[#FAF7F2] dark:bg-stone-800 px-3 py-2 text-xs text-[#2A211B] dark:text-stone-100 placeholder:text-[#75675C] dark:placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C46A28] dark:focus:ring-[#F5A764] resize-none"
            />
            <div className="flex justify-between text-[11px] text-[#75675C] dark:text-stone-400">
              <span>{trimmed.length}/1000</span>
              {trimmed.length > 0 && trimmed.length < 10 && (
                <span className="text-rose-600 dark:text-rose-400">
                  {isVi ? `Cần thêm ${10 - trimmed.length} ký tự` : `${10 - trimmed.length} more chars needed`}
                </span>
              )}
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-3 py-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 min-h-[40px] rounded-xl border border-[#EADBCE] dark:border-stone-700 text-xs font-semibold text-[#5C5047] dark:text-stone-300 hover:bg-[#FAF7F2] dark:hover:bg-stone-800 transition cursor-pointer"
            >
              {isVi ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 min-h-[40px] rounded-xl bg-[#C46A28] hover:bg-[#A65A24] dark:bg-[#F5A764] dark:hover:bg-[#E89650] text-white dark:text-stone-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isVi ? 'Gửi báo cáo' : 'Submit report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
