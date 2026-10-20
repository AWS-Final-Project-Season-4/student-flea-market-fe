///////////////////////////////////////////////////////////
//                                                       //
//                   LOGIN PAGE                          //
//                                                       //
///////////////////////////////////////////////////////////

"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting login form:", { identifier, password });
    };

    return (
        // Canvas: Warm cream background (#FAF7F2) with editorial aesthetics
        <div className="min-h-screen w-full bg-[#FAF7F2] text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-[#F7B97B]/40 selection:text-slate-900">

            {/* Background Whimsical Doodles & Sparkles */}
            <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
                {/* Top Center-Right Sparkles */}
                <svg className="absolute top-16 right-[28%] w-10 h-10 text-slate-300 stroke-current fill-none" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                <svg className="absolute top-28 right-[24%] w-6 h-6 text-slate-300 stroke-current fill-none" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 2L14 8.5L20 12L14 15.5L12 22L10 15.5L4 12L10 8.5L12 2Z" />
                </svg>

                {/* Left Floating Doodle Arcs & Circles */}
                <svg className="absolute top-44 left-[14%] w-24 h-24 text-slate-300 stroke-current fill-none" strokeWidth="1.5" viewBox="0 0 100 100">
                    <path d="M 20,60 C 20,30 60,30 60,60" />
                    <path d="M 10,70 C 10,20 70,20 70,70" />
                    <circle cx="85" cy="40" r="3" />
                </svg>

                {/* Free Floating Doodle Squiggles */}
                <svg className="absolute bottom-28 left-[24%] w-20 h-12 text-slate-300 stroke-current fill-none" strokeWidth="1.5" viewBox="0 0 80 40">
                    <path d="M 10,20 Q 25,5 40,20 T 70,20" />
                </svg>
                <svg className="absolute top-36 right-[12%] w-24 h-14 text-slate-300 stroke-current fill-none" strokeWidth="1.5" viewBox="0 0 80 40">
                    <path d="M 5,20 C 25,5 45,35 65,20 C 75,10 85,25 75,35" />
                </svg>
            </div>

            {/* ======================================================== */}
            {/* 1. TOP NAVIGATION BAR                                    */}
            {/* ======================================================== */}
            <header className="w-full max-w-7xl mx-auto flex items-center justify-between py-2 relative z-20">
                {/* Brand Logo */}
                <div className="flex flex-col">
                    <Link href="/" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 hover:opacity-90 transition">
                        Student Flea Market
                    </Link>
                </div>

                {/* Right Nav: Language & Sign Up */}
                <div className="flex items-center gap-3 sm:gap-4">
                    <button
                        type="button"
                        className="text-slate-600 hover:text-slate-900 transition p-1.5 rounded-full hover:bg-slate-200/50 cursor-pointer"
                        aria-label="Change Language"
                    >
                        <Globe className="w-4 h-4" />
                    </button>

                    <Link
                        href="/register"
                        className="text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-950 transition px-2"
                    >
                        Sign up
                    </Link>
                </div>
            </header>

            {/* ======================================================== */}
            {/* 2 & 3. UNIFIED ART STAGE: CARD + COMPOSITION             */}
            {/* ======================================================== */}
            <div className="w-full max-w-7xl mx-auto flex items-center justify-center relative z-10 my-auto py-6">

                {/* Ground Baseline connecting both compositions */}
                <div className="hidden lg:block absolute bottom-8 left-8 right-8 border-b border-slate-300/60 pointer-events-none z-0" />

                {/* ===================================================== */}
                {/* LEFT COMPOSITION: Ochre Pillar + Arrow Box + Sketch   */}
                {/* ===================================================== */}
                <div className="hidden lg:block absolute right-[calc(50%+235px)] bottom-8 pointer-events-none select-none z-0">
                    <div className="relative w-80 h-92">

                        {/* Floating Wireframe Sketch Box above */}
                        <div className="absolute top-8 left-8 w-28 h-18 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-400/80 p-2.5 shadow-xs flex flex-col justify-between">
                            <div className="w-full h-full border border-slate-300/80 rounded-md relative flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-full border-l border-slate-200"></div>
                                </div>
                            </div>
                        </div>

                        {/* Unified Vector Stage for Left Side */}
                        <svg className="w-full h-full relative z-10" viewBox="0 0 320 360" fill="none">
                            {/* Ochre-Yellow / Peach Polka Dot Pillar */}
                            <rect x="35" y="150" width="65" height="170" rx="14" fill="#F4C28D" stroke="#1E293B" strokeWidth="2" />
                            {/* Neat Polka Dots */}
                            {[
                                [52, 175], [82, 175],
                                [52, 205], [82, 205],
                                [52, 235], [82, 235],
                                [52, 265], [82, 265],
                                [52, 295], [82, 295],
                            ].map(([cx, cy], i) => (
                                <circle key={i} cx={cx} cy={cy} r="4.5" fill="#1E293B" />
                            ))}

                            {/* White Box with Growth Curve Arrow */}
                            <rect x="105" y="210" width="85" height="110" rx="8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
                            {/* Upward hand-drawn curved arrow */}
                            <path
                                d="M 122,285 C 132,285 144,265 155,238 L 160,228"
                                stroke="#1E293B"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M 146,228 H 160 V 242"
                                stroke="#1E293B"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Doodles & Radiating Wave Lines */}
                            <path d="M 20,210 C 20,185 8,185 8,210" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M 28,210 C 28,175 0,175 0,210" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="215" cy="180" r="3.5" stroke="#94A3B8" strokeWidth="1.5" />
                            <path d="M 220,260 C 235,270 240,245 255,255" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>

                    </div>
                </div>

                {/* ===================================================== */}
                {/* CENTRAL FLOATING LOGIN CARD                           */}
                {/* ===================================================== */}
                <main className="w-full max-w-[430px] relative z-10">
                    <div className="w-full bg-white rounded-[34px] sm:rounded-[38px] p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(217,119,6,0.08),0_10px_30px_-10px_rgba(0,0,0,0.04)] border border-slate-200/80">

                        {/* Header Title & Subtitle */}
                        <div className="text-center mb-7">
                            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
                                Login
                            </h1>
                            <p className="text-xs sm:text-[13px] text-slate-500 mt-2 max-w-[260px] mx-auto leading-relaxed">
                                Hey, Enter your details to get sign in to your account
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-4">

                            {/* Identifier Input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                    placeholder="Enter Email / Phone No"
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition"
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-300 pointer-events-none" />
                            </div>

                            {/* Password Input with Eye Icon */}
                            <div className="relative flex items-center">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Passcode"
                                    className="w-full h-12 pl-4 pr-11 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800/10 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer select-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Trouble link */}
                            <div className="text-right pt-0.5">
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-medium text-amber-700/80 hover:text-amber-900 transition"
                                >
                                    Having trouble in sign in?
                                </Link>
                            </div>

                            {/* Primary Action Button (Peach Orange) */}
                            <button
                                type="submit"
                                className="w-full h-12 rounded-xl bg-[#F7B97B] hover:bg-[#efa964] active:scale-[0.99] text-slate-900 font-bold text-sm shadow-xs transition duration-150 flex items-center justify-center cursor-pointer mt-2"
                            >
                                Sign in
                            </button>
                        </form>

                        {/* Social Divider */}
                        <div className="relative my-6 text-center">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200/80"></div>
                            </div>
                            <span className="relative bg-white px-3 text-[11px] font-medium text-slate-400 tracking-wider">
                                — Or Sign in with —
                            </span>
                        </div>

                        {/* Social Login Buttons: Google, Apple ID, Facebook */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                            {/* Google */}
                            <button
                                type="button"
                                onClick={() => console.log("Google Login")}
                                className="h-10 px-2 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition duration-150 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer shadow-2xs"
                            >
                                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z" />
                                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.26 21.36 7.33 24 12 24z" />
                                    <path fill="#FBBC05" d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.09z" />
                                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z" />
                                </svg>
                                <span>Google</span>
                            </button>

                            {/* Apple ID */}
                            <button
                                type="button"
                                onClick={() => console.log("Apple Login")}
                                className="h-10 px-2 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition duration-150 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer shadow-2xs"
                            >
                                <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 170 170">
                                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.66-7.85-11.91-14.42-6.75-10.45-12.02-21.96-15.8-34.52-3.79-12.57-5.68-24.32-5.68-35.26 0-14.44 3.73-26.65 11.2-36.63 7.46-9.97 16.92-15.08 28.37-15.32 4.91 0 10.37 1.34 16.39 4.02 6.01 2.68 10.12 4.08 12.33 4.2 2.69-.34 7.21-1.9 13.56-4.68 6.35-2.79 11.83-4.02 16.44-3.69 12.57.89 22.74 5.37 30.52 13.44-11.06 6.7-16.47 16.03-16.23 27.99.23 9.4 3.78 17.26 10.66 23.59 6.87 6.33 15.11 10.02 24.71 11.06-2.23 6.92-4.91 13.73-8.04 20.44zM119.22 31.84c0-7.37 2.68-14.42 8.04-21.15 5.36-6.73 12.18-10.69 20.45-11.89.22 1.34.34 2.57.34 3.69 0 7.37-2.8 14.53-8.38 21.46-5.59 6.93-12.41 10.9-20.45 11.89z" />
                                </svg>
                                <span>Apple ID</span>
                            </button>

                            {/* Facebook */}
                            <button
                                type="button"
                                onClick={() => console.log("Facebook Login")}
                                className="h-10 px-2 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition duration-150 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer shadow-2xs"
                            >
                                <svg className="w-3.5 h-3.5 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span>Facebook</span>
                            </button>
                        </div>

                        {/* Bottom Sign-up Redirect */}
                        <p className="text-center text-xs text-slate-500 mt-6">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/register"
                                className="font-bold text-slate-900 hover:underline transition ml-0.5"
                            >
                                Request now
                            </Link>
                        </p>

                    </div>
                </main>

                {/* ===================================================== */}
                {/* RIGHT COMPOSITION: Desk with Centered Clean MacBook   */}
                {/* ===================================================== */}
                <div className="hidden lg:block absolute left-[calc(50%+235px)] bottom-8 pointer-events-none select-none z-0">
                    <div className="relative w-84 h-92">

                        {/* Floating Wireframe Skeleton Card above */}
                        <div className="absolute top-6 left-6 w-20 h-14 bg-white/80 backdrop-blur-xs rounded-xl border border-slate-400/80 p-2.5 shadow-xs flex flex-col justify-center gap-1.5 z-0">
                            <div className="w-10 h-1.5 bg-slate-300/80 rounded-full" />
                            <div className="w-14 h-1.5 bg-slate-300/80 rounded-full" />
                        </div>

                        {/* Background Wavy Squiggle */}
                        <svg className="absolute -top-2 right-6 w-24 h-12 text-slate-400 stroke-current fill-none" strokeWidth="1.5" viewBox="0 0 100 40">
                            <path d="M 5,20 Q 25,5 45,20 T 85,20" strokeLinecap="round" />
                        </svg>

                        {/* Unified Editorial Vector Still-Life Scene */}
                        <svg className="w-full h-full relative z-10" viewBox="0 0 340 360" fill="none">
                            {/* 1. Ochre-Yellow / Peach Polka Dot Pillar on the right */}
                            <rect x="240" y="170" width="55" height="150" rx="12" fill="#F4C28D" stroke="#1E293B" strokeWidth="2" />
                            {/* Polka Dots */}
                            {[
                                [257, 195], [280, 195],
                                [257, 225], [280, 225],
                                [257, 255], [280, 255],
                                [257, 285], [280, 285],
                            ].map(([cx, cy], i) => (
                                <circle key={i} cx={cx} cy={cy} r="4.5" fill="#1E293B" />
                            ))}

                            {/* 2. White Pedestal Desk (Width: 200, perfectly centered) */}
                            <rect x="30" y="210" width="200" height="110" rx="10" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
                            <line x1="30" y1="222" x2="230" y2="222" stroke="#E2E8F0" strokeWidth="1.5" />

                            {/* 3. Stack of 3 Books on the left of desk */}
                            {/* Book 1 (Bottom - Soft Pastel Blue) */}
                            <rect x="42" y="196" width="46" height="14" rx="2.5" fill="#BFDBFE" stroke="#1E293B" strokeWidth="2" />
                            <line x1="50" y1="196" x2="50" y2="210" stroke="#1E293B" strokeWidth="1.5" />

                            {/* Book 2 (Middle - Warm Peach) */}
                            <rect x="44" y="182" width="42" height="14" rx="2.5" fill="#F7B97B" stroke="#1E293B" strokeWidth="2" />
                            <line x1="52" y1="182" x2="52" y2="196" stroke="#1E293B" strokeWidth="1.5" />

                            {/* Book 3 (Top - Sage Green with bookmark) */}
                            <rect x="46" y="168" width="38" height="14" rx="2.5" fill="#B6D7A8" stroke="#1E293B" strokeWidth="2" />
                            <line x1="54" y1="168" x2="54" y2="182" stroke="#1E293B" strokeWidth="1.5" />
                            {/* Red Bookmark Ribbon */}
                            <path d="M 72,168 L 72,178 L 76,175 L 80,178 L 80,168 Z" fill="#E11D48" stroke="#1E293B" strokeWidth="1.25" />

                            {/* 4. Ceramic Coffee Mug resting on books */}
                            <rect x="54" y="146" width="16" height="22" rx="3" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
                            <path d="M 70,151 C 75,151 75,163 70,163" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
                            {/* Rising Steam */}
                            <path d="M 59,140 Q 57,130 62,120 T 59,108" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M 65,138 Q 68,128 63,118 T 66,106" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />

                            {/* ================================================= */}
                            {/* 5. PERFECTLY CENTERED & STRAIGHT RECTANGLE MACBOOK*/}
                            {/* ================================================= */}
                            {/* Contact Shadow beneath base */}
                            <ellipse cx="130" cy="211" rx="50" ry="3.5" fill="#000000" opacity="0.08" />

                            {/* MacBook Aluminum Chassis / Base (Slim horizontal bar, centered at x=130) */}
                            <rect x="82" y="208" width="96" height="4" rx="2" fill="#E2E8F0" stroke="#1E293B" strokeWidth="1.75" />
                            {/* Center Thumb Notch */}
                            <rect x="124" y="208" width="12" height="1.5" rx="0.75" fill="#94A3B8" />

                            {/* Black Hinge Bar */}
                            <rect x="106" y="205" width="48" height="3" rx="1.5" fill="#1E293B" />

                            {/* MacBook Screen Lid: TRUE CLEAN RECTANGLE with smooth rounded corners */}
                            <rect
                                x="88"
                                y="148"
                                width="84"
                                height="58"
                                rx="6"
                                fill="#F8FAFC"
                                stroke="#1E293B"
                                strokeWidth="2"
                            />

                            {/* --- APPLE LOGO DEAD CENTER ON LID (Center: x=130, y=177) --- */}
                            {/* Apple Leaf */}
                            <path
                                d="M 130.5,169 C 132.5,167 133.5,164.5 132.5,162.5 C 130.5,162.5 128,164.5 127,167 C 127,169 129.5,169 130.5,169 Z"
                                fill="#1E293B"
                            />
                            {/* Apple Body with iconic bite */}
                            <path
                                d="M 131.5,170.5 C 130,170.5 129,170 128,170 C 127,170 126,170.5 124.5,170.5 C 122,170.5 119.5,173.5 119.5,177.5 C 119.5,181.5 122,186 124.5,186 C 125.5,186 126.5,185.5 128,185.5 C 129.5,185.5 130.5,186 131.5,186 C 134,186 136,181.5 136,179.5 C 134,179 133.5,177 133.5,175.5 C 133.5,174 134.5,172.5 135.5,172 C 134.5,171 133,170.5 131.5,170.5 Z"
                                fill="#1E293B"
                            />

                            {/* 6. Cute Desk Succulent on the right of desk */}
                            <polygon points="194,198 208,198 205,210 197,210" fill="#FDBA74" stroke="#1E293B" strokeWidth="1.75" />
                            <path d="M 201,198 C 196,188 190,186 188,180 C 194,180 199,186 201,198 Z" fill="#86EFAC" stroke="#1E293B" strokeWidth="1.5" />
                            <path d="M 201,198 C 201,186 208,182 212,176 C 211,185 207,191 201,198 Z" fill="#4ADE80" stroke="#1E293B" strokeWidth="1.5" />
                            <path d="M 201,198 C 199,188 201,178 202,172 C 204,180 203,189 201,198 Z" fill="#22C55E" stroke="#1E293B" strokeWidth="1.5" />
                        </svg>

                    </div>
                </div>

            </div>

            {/* ======================================================== */}
            {/* 4. FOOTER                                                */}
            {/* ======================================================== */}
            <footer className="w-full text-center py-2 relative z-10">
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium tracking-tight">
                    Copyright @StudentFleaMarket 2026 &nbsp;|&nbsp; Privacy Policy
                </p>
            </footer>

        </div>
    );
}
