///////////////////////////////////////////////////////////
//                                                       //
//             POLICY DOCUMENT CLIENT VIEW               //
//                                                       //
///////////////////////////////////////////////////////////

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useLanguageStore } from '@/lib/language-store';
import { useThemeStore } from '@/lib/theme-store';

interface PolicyDetailClientProps {
  contentEn: string;
  contentVi: string;
}

export function PolicyDetailClient({ contentEn, contentVi }: PolicyDetailClientProps) {
  const { language, setLanguage } = useLanguageStore();
  const { initTheme } = useThemeStore();
  const isVi = language === 'vi';

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const markdownContent = isVi ? contentVi : contentEn;

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-stone-950 font-sans text-[#2A211B] dark:text-stone-100 pb-16 transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-[#EADBCE] dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link
            href="/settings?tab=policies"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#5C5047] dark:text-stone-300 hover:text-[#B8652B] dark:hover:text-[#F5A764] transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{isVi ? 'Quay lại Cài đặt' : 'Back to Settings'}</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold text-[#2A211B] dark:text-stone-100">
                {isVi ? 'Chính sách Student Flea Market' : 'Student Flea Market Compliance'}
              </span>
            </div>

            {/* Quick Language Switch */}
            <div className="flex items-center p-0.5 rounded-full bg-[#FAF7F2] dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                  isVi
                    ? 'bg-white dark:bg-stone-800 text-[#B8652B] dark:text-[#F5A764] font-bold shadow-2xs'
                    : 'text-[#7A6D63] dark:text-stone-400'
                }`}
              >
                VIE
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                  !isVi
                    ? 'bg-white dark:bg-stone-800 text-[#B8652B] dark:text-[#F5A764] font-bold shadow-2xs'
                    : 'text-[#7A6D63] dark:text-stone-400'
                }`}
              >
                ENG
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Policy Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <article className="bg-white dark:bg-stone-900 p-6 sm:p-12 rounded-3xl shadow-xs border border-[#EADBCE] dark:border-stone-800">
          <ReactMarkdown
            components={{
              h1: ({ ...props }) => (
                <h1
                  className="text-2xl sm:text-3xl font-extrabold text-[#2A211B] dark:text-stone-100 mb-6 pb-4 border-b border-[#EADBCE] dark:border-stone-800"
                  {...props}
                />
              ),
              h2: ({ ...props }) => (
                <h2
                  className="text-lg sm:text-xl font-bold text-[#2A211B] dark:text-stone-100 mt-8 mb-4 tracking-tight"
                  {...props}
                />
              ),
              h3: ({ ...props }) => (
                <h3
                  className="text-base sm:text-lg font-semibold text-[#2A211B] dark:text-stone-200 mt-6 mb-3"
                  {...props}
                />
              ),
              p: ({ ...props }) => (
                <p
                  className="text-[#4A3F37] dark:text-stone-300 leading-relaxed mb-4 text-sm sm:text-base"
                  {...props}
                />
              ),
              ul: ({ ...props }) => (
                <ul
                  className="list-disc list-inside space-y-2 mb-6 text-[#4A3F37] dark:text-stone-300 pl-2 text-sm sm:text-base"
                  {...props}
                />
              ),
              ol: ({ ...props }) => (
                <ol
                  className="list-decimal list-inside space-y-2 mb-6 text-[#4A3F37] dark:text-stone-300 pl-2 text-sm sm:text-base"
                  {...props}
                />
              ),
              li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
              strong: ({ ...props }) => (
                <strong className="font-semibold text-[#2A211B] dark:text-stone-100" {...props} />
              ),
              code: ({ ...props }) => (
                <code
                  className="bg-[#FAF7F2] dark:bg-stone-800 text-[#B8652B] dark:text-[#F5A764] px-1.5 py-0.5 rounded text-xs font-mono font-medium border border-[#EADBCE] dark:border-stone-700"
                  {...props}
                />
              ),
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
