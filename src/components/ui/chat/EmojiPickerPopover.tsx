'use client';

import React, { useEffect, useRef, useState } from 'react';

interface EmojiCategory {
  id: string;
  icon: string;
  labelVi: string;
  labelEn: string;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    icon: '😀',
    labelVi: 'Cảm xúc',
    labelEn: 'Smileys',
    emojis: [
      '😀', '😄', '😁', '😆', '😅', '😂', '🤣', '😊',
      '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😎',
      '🤩', '🥳', '🤔', '🤨', '😮', '😢', '😭', '😤',
      '🥺', '🙏', '🤝', '❤️', '🧡', '💛', '💚', '✨',
    ],
  },
  {
    id: 'gestures',
    icon: '👍',
    labelVi: 'Cử chỉ',
    labelEn: 'Gestures',
    emojis: [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '👏', '🙌',
      '🫶', '💪', '👋', '🤚', '✍️', '👀', '💯', '✅',
      '❌', '❓', '❗', '🔥', '🎉', '⭐', '🌟', '💬',
    ],
  },
  {
    id: 'campus',
    icon: '🛍️',
    labelVi: 'Trao đổi & Hẹn',
    labelEn: 'Campus Trade',
    emojis: [
      '🛍️', '📦', '📚', '💻', '🎧', '🚲', '👕', '🎒',
      '💵', '💳', '📍', '🗺️', '🏫', '🛵', '⏰', '📅',
      '🕒', '☕', '🍵', '📝', '📸', '🔔', '🎁', '🏷️',
    ],
  },
];

interface EmojiPickerPopoverProps {
  isVi: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isVi,
  onSelect,
  onClose,
}) => {
  const [activeCat, setActiveCat] = useState<string>(EMOJI_CATEGORIES[0].id);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClose]);

  const current =
    EMOJI_CATEGORIES.find((cat) => cat.id === activeCat) ?? EMOJI_CATEGORIES[0];

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={isVi ? 'Chọn biểu tượng cảm xúc' : 'Choose an emoji'}
      className="absolute bottom-full right-0 mb-2 z-40 w-[290px] sm:w-[320px] rounded-2xl border border-[#EADBCE] dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Category tabs */}
      <div className="flex items-center gap-1 px-2.5 py-2 border-b border-[#EFE8DD] dark:border-stone-800 bg-[#FAF7F2] dark:bg-stone-800/70">
        {EMOJI_CATEGORIES.map((cat) => {
          const isSelected = cat.id === activeCat;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(cat.id)}
              title={isVi ? cat.labelVi : cat.labelEn}
              aria-label={isVi ? cat.labelVi : cat.labelEn}
              aria-pressed={isSelected}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-stone-900 text-[#C46A28] dark:text-[#F5A764] shadow-2xs border border-[#EADBCE] dark:border-stone-700'
                  : 'text-[#6D5D52] dark:text-stone-400 hover:bg-white/60 dark:hover:bg-stone-800'
              }`}
            >
              <span aria-hidden="true">{cat.icon}</span>
              <span className="truncate text-[11px]">
                {isVi ? cat.labelVi : cat.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Emoji grid */}
      <div className="p-2.5 max-h-[210px] overflow-y-auto grid grid-cols-8 gap-1">
        {current.emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            aria-label={emoji}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-lg hover:bg-[#FAF7F2] dark:hover:bg-stone-800 active:scale-90 transition cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
