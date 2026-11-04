'use client';

import React from 'react';
import { ShieldCheck, MapPin, ArrowRight, Plus } from 'lucide-react';
import { useLanguageStore, DICTIONARY } from '@/lib/language-store';

interface HeroBannerProps {
    onPostItemClick?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onPostItemClick }) => {
    const { language } = useLanguageStore();
    const t = DICTIONARY[language];

    return (
        <section className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#FBF7F0] via-[#F4E9DC] to-[#E8D7C3] border border-[#E5D5C2] text-[#2A211B] shadow-xl shadow-[#8C5E3C]/8">

            {/* Subtle Organic Wave Overlays */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                <svg
                    className="absolute w-[180%] h-full -top-1/4 -left-1/4"
                    viewBox="0 0 1000 600"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M0,300 C200,450 350,150 550,280 C750,410 850,200 1000,320 L1000,600 L0,600 Z"
                        fill="white"
                    />
                    <path
                        d="M0,380 C180,240 380,420 600,290 C800,160 920,380 1000,340 L1000,600 L0,600 Z"
                        fill="white"
                        fillOpacity="0.5"
                    />
                </svg>
            </div>

            {/* Soft Ambient Warm Glows */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/50 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#F5A764]/20 blur-2xl pointer-events-none" />

            {/* Main Content Layout */}
            <div className="relative z-10 p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10">

                    {/* Left Column (Content & CTAs) */}
                    <div className="w-full lg:max-w-xl text-center lg:text-left">

                        {/* Top Badge: Warm Caramel Beige Badge */}
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#F5A764]/20 border border-[#F5A764]/40 text-[#A85A24] font-bold text-xs sm:text-sm tracking-wider uppercase shadow-2xs">
                            <span>{t.hero.badge}</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-2xl sm:text-4xl lg:text-[40px] xl:text-[46px] font-extrabold text-[#2A211B] tracking-tight leading-[1.18] mt-3 sm:mt-4">
                            <span className="block">{t.hero.headlinePart1}</span>
                            <span className="block text-[#C46A28] drop-shadow-xs mt-1 sm:mt-1.5">{t.hero.headlinePart2}</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-[#6D5D52] text-xs sm:text-sm md:text-base max-w-lg mt-3 leading-relaxed mx-auto lg:mx-0">
                            {t.hero.subtitle}
                        </p>

                        {/* Button Group */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 mt-5 sm:mt-6">
                            {/* Primary Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    const productSection = document.querySelector('.grid');
                                    productSection?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="bg-[#F5A764] hover:bg-[#E89650] text-white font-semibold px-5 sm:px-6 py-2.5 rounded-full shadow-[0_4px_14px_rgba(245,167,100,0.35)] hover:shadow-[0_6px_20px_rgba(245,167,100,0.45)] flex items-center gap-2 transition-all active:scale-98 cursor-pointer text-xs sm:text-sm"
                            >
                                <span>{t.hero.btnBrowse}</span>
                                <ArrowRight className="w-4 h-4 text-white" />
                            </button>

                            {/* Secondary Button: Post an Item (Free listing flow) */}
                            <button
                                type="button"
                                onClick={onPostItemClick}
                                className="bg-white/90 hover:bg-white border border-[#D5BEA8] text-[#2A211B] font-semibold px-5 sm:px-6 py-2.5 rounded-full shadow-2xs hover:shadow-xs flex items-center gap-2 transition-all active:scale-98 text-xs sm:text-sm cursor-pointer"
                            >
                                <span>{t.hero.btnPost}</span>
                                <Plus className="w-4 h-4 text-[#C46A28]" />
                            </button>
                        </div>

                    </div>

                    {/* Right Column: Clean Framed Showcase Card */}
                    <div className="w-full lg:max-w-md flex flex-col items-center justify-center relative">

                        {/* Top-Right Badge: Frosted Glassmorphism Pill */}
                        <div className="self-end z-20 mb-[-12px] mr-2 bg-white/90 backdrop-blur-md text-[#2A211B] text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md border border-[#EADBCE]">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{t.hero.trustBadge1}</span>
                        </div>

                        {/* Grounded Real Campus Image in Framed Card */}
                        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border-2 border-white shadow-xl shadow-[#2A211B]/10 bg-[#FAF7F2]">
                            <img
                                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80"
                                alt="Student Flea Market"
                                className="w-full h-full object-cover"
                            />
                            {/* Subtle warm gradient overlay at bottom for contrast */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#2A211B]/40 via-transparent to-transparent" />
                        </div>

                        {/* Bottom-Right Badge: Frosted Glassmorphism Pill */}
                        <div className="self-start z-20 mt-[-12px] ml-2 bg-white/90 backdrop-blur-md text-[#2A211B] text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md border border-[#EADBCE]">
                            <MapPin className="w-3.5 h-3.5 text-[#C46A28] shrink-0" />
                            <span>{t.hero.trustBadge2}</span>
                        </div>

                    </div>

                </div>
            </div>

        </section>
    );
};

export default HeroBanner;
