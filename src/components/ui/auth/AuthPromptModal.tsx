'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';

export const AuthPromptModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isInitialized, initAuth } = useAuthStore();
  const { language } = useLanguageStore();
  const t = DICTIONARY[language];

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isInitialized) return;

    // Do not display if user is already logged in
    if (isAuthenticated) return;

    // Check if user has already dismissed this modal in current browser session
    const isDismissed = sessionStorage.getItem('sfm_auth_prompt_dismissed');
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isInitialized]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('sfm_auth_prompt_dismissed', 'true');
  };

  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-[#EADBCE]">

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F3EADF] text-[#8C7E74] hover:text-[#2A211B] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2A211B] mb-2 mt-2 flex items-center justify-center gap-2">
          <span>{t.authPrompt.title}</span>
          <span className="text-2xl select-none">👋</span>
        </h2>

        {/* Subtitle / Description */}
        <p className="text-[#6D5D52] text-xs sm:text-sm leading-relaxed max-w-xs mb-6">
          {t.authPrompt.desc}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full justify-center">
          <Link
            href="/login"
            onClick={handleClose}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-2.5 rounded-xl bg-[#F5A764] hover:bg-[#E89650] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <LogIn className="w-4 h-4" />
            <span>{t.navbar.login}</span>
          </Link>

          <Link
            href="/register"
            onClick={handleClose}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-2.5 rounded-xl border border-[#EADBCE] hover:border-[#D5BEA8] hover:bg-[#FAF7F2] text-[#2A211B] font-semibold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#8C7E74]" />
            <span>{t.navbar.register}</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
