'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  href?: string | null;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'compact',
  size = 'md',
  href = '/',
  className = '',
}) => {
  // Dimensions based on size
  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href === '/') {
      e.preventDefault();
      if (typeof window !== 'undefined') {
        if (window.location.pathname === '/' && !window.location.search) {
          window.location.reload();
        } else {
          window.location.href = '/';
        }
      }
    }
  };

  const content = (
    <div className={`inline-flex items-center gap-3 shrink-0 group cursor-pointer ${className}`}>
      {/* Clean, Sharp, Professional Logo Container */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-tr from-[#E89650] via-[#F5A764] to-[#FBD6B0] shadow-sm flex items-center justify-center transform group-hover:scale-105 transition-all duration-200 border border-white/20 overflow-hidden shrink-0`}
      >
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full p-1.5 drop-shadow-xs">
          <defs>
            <linearGradient id="bagGradClean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F8FAFC" />
            </linearGradient>
            <linearGradient id="tasselGoldClean" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          {/* Bag Handles */}
          <path
            d="M19 15C19 11.8 21.2 9.5 24 9.5C26.8 9.5 29 11.8 29 15"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Clean White Shopping Bag */}
          <path
            d="M12 15H36L33.8 39.5C33.6 41 32.4 42 30.8 42H17.2C15.6 42 14.4 41 14.2 39.5L12 15Z"
            fill="url(#bagGradClean)"
          />

          {/* Golden Graduation Tassel hanging on left handle */}
          <path
            d="M19 13.5C16.8 15 15.2 17 14.5 20.2"
            stroke="url(#tasselGoldClean)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="14.5" cy="21.5" r="1.8" fill="url(#tasselGoldClean)" />

          {/* Bold Clean 'S' inside the bag (Student) */}
          <path
            d="M27.5 24C26.8 23 25.5 22.5 24 22.5C22 22.5 20.5 23.7 20.5 25.5C20.5 27.2 21.8 28.2 24 28.8C26.5 29.5 27.8 30.5 27.8 32.5C27.8 34.6 26 36 23.8 36C21.8 36 20.2 35 19.5 33.5"
            stroke="#A8744F"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Typography */}
      {variant !== 'icon' && (
        <div className="flex flex-col shrink-0">
          <span
            className={`font-bold ${titleSizes[size]} tracking-tight whitespace-nowrap leading-tight`}
          >
            <span className="text-[#C89B6D] group-hover:text-[#A8744F] transition-colors">Student Flea Market</span>
          </span>
          {variant === 'full' && (
            <span className="text-[11px] font-medium text-slate-500 hidden xl:block whitespace-nowrap">
              Buying & Selling • Exchanging • Connecting Students
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={handleLogoClick}
        className="inline-block shrink-0 cursor-pointer select-none"
        title="Student Flea Market - Click to reload homepage"
      >
        {content}
      </Link>
    );
  }

  return content;
};
