'use client';

import React from 'react';
import { ShieldCheck, Zap, Users, Sparkles, Send } from 'lucide-react';

export const HeroBanner: React.FC = () => {
    return (
        <section className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-blue-500 to-sky-400 text-white shadow-xl shadow-blue-500/10">

            {/* Decorative Glow & Paper Plane Vector */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-sky-300/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                    {/* Left Column: Headline, Subtitle & Trust Badges */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Top Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/30 bg-white/15 backdrop-blur-md shadow-xs">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            <span className="text-xs sm:text-sm font-medium tracking-wide">
                                Secondhand Deals – Reuse – Save
                            </span>
                        </div>

                        {/* Main Headline */}
                        <div className="space-y-2">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-xs">
                                Exchanging used items - <br />
                                <span className="text-yellow-300 drop-shadow-sm">
                                    Connecting students
                                </span>
                            </h1>
                            <p className="text-sky-100 text-sm sm:text-base font-normal max-w-lg leading-relaxed">
                                Used items still have value—they just need to find the right person! Buy, sell, or trade safely.
                            </p>
                        </div>

                        {/* 3 Trust Badges Container */}
                        <div className="inline-flex flex-wrap items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">

                            {/* Badge 1: Safety */}
                            <div className="flex items-center gap-2.5 px-3 py-1.5">
                                <div className="p-2 rounded-xl bg-blue-600/40 text-white shrink-0">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold leading-none">Safe</h4>
                                    <p className="text-[11px] text-sky-100 leading-tight">Transactions</p>
                                </div>
                            </div>

                            {/* Vertical divider */}
                            <div className="hidden sm:block w-px h-8 bg-white/20" />

                            {/* Badge 2: Fast */}
                            <div className="flex items-center gap-2.5 px-3 py-1.5">
                                <div className="p-2 rounded-xl bg-amber-500/40 text-yellow-300 shrink-0">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold leading-none">Fast</h4>
                                    <p className="text-[11px] text-sky-100 leading-tight">Convenient</p>
                                </div>
                            </div>

                            {/* Vertical divider */}
                            <div className="hidden sm:block w-px h-8 bg-white/20" />

                            {/* Badge 3: Community */}
                            <div className="flex items-center gap-2.5 px-3 py-1.5">
                                <div className="p-2 rounded-xl bg-emerald-500/40 text-emerald-200 shrink-0">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold leading-none">Community</h4>
                                    <p className="text-[11px] text-sky-100 leading-tight">Students</p>
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* Right Column: Illustration Graphic Card */}
                    <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/30 bg-white/10 backdrop-blur-md p-4 shadow-2xl">

                            {/* Composite Visual Canvas */}
                            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-gradient-to-tr from-sky-600/50 to-blue-400/40 flex items-center justify-center">
                                {/* Embedded Student Life Collage Image */}
                                <img
                                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80"
                                    alt="Student Flea Market lifestyle"
                                    className="w-full h-full object-cover mix-blend-overlay opacity-80"
                                />

                                {/* Floating Student Community Note */}
                                <div className="absolute top-3 right-3 bg-yellow-200 text-slate-800 p-3 rounded-lg shadow-lg rotate-2 max-w-[170px] border border-yellow-300">
                                    <p className="text-[11px] font-bold leading-tight font-sans">
                                        &ldquo;Students connecting for a civilized community :)&rdquo;
                                    </p>
                                </div>

                                {/* Floating Item Tags */}
                                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-bold">1,200+ items currently for sale</span>
                                </div>
                            </div>

                            {/* Paper Plane Aesthetic Indicator */}
                            <div className="absolute -top-3 -left-3 p-2 bg-white text-blue-600 rounded-full shadow-lg transform -rotate-12">
                                <Send className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Carousel Pagination Dots */}
                <div className="flex items-center justify-center gap-2 mt-8">
                    <span className="w-6 h-2 rounded-full bg-slate-900 transition-all duration-300" />
                    <span className="w-2 h-2 rounded-full bg-white/60 hover:bg-white cursor-pointer transition-colors" />
                    <span className="w-2 h-2 rounded-full bg-white/60 hover:bg-white cursor-pointer transition-colors" />
                    <span className="w-2 h-2 rounded-full bg-white/60 hover:bg-white cursor-pointer transition-colors" />
                </div>

            </div>
        </section>
    );
};
