'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export const AuthPromptModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isInitialized, initAuth } = useAuthStore();

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

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('sfm_auth_prompt_dismissed', 'true');
  };

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
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-slate-100">

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-blue-600 mb-2 mt-2 flex items-center justify-center gap-2">
          <span>Hi!</span>
          <span className="text-2xl select-none">👋</span>
        </h2>

        {/* Subtitle / Description */}
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xs mb-6">
          Would you like to register or login to enjoy the best experience on Student Market?
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full justify-center">
          <Link
            href="/login"
            onClick={handleClose}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-2.5 rounded-xl border border-blue-600 text-blue-600 font-semibold text-xs sm:text-sm hover:bg-blue-50 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </Link>

          <Link
            href="/register"
            onClick={handleClose}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

