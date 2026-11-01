///////////////////////////////////////////////////////////
//                                                       //
//                 POLICY DOCUMENT PAGE                  //
//                                                       //
///////////////////////////////////////////////////////////

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPolicySlugs, getPolicyBySlug } from '@/lib/policies';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

interface PolicyPageProps {
    params: Promise<{
        slug: string;
    }>;
}

/**
 * Pre-renders all policy routes at build time for optimal performance
 */
export async function generateStaticParams() {
    const slugs = getAllPolicySlugs();
    return slugs.map((slug) => ({
        slug: slug,
    }));
}

/**
 * Dynamic SEO metadata generator for regulatory documents
 */
export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
    const { slug } = await params;
    const policy = getPolicyBySlug(slug);

    if (!policy) {
        return {
            title: 'Policy Not Found - Student Flea Market',
        };
    }

    const formattedTitle = slug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return {
        title: `${formattedTitle} | Student Flea Market Compliance`,
        description: `Official regulatory policy document for ${formattedTitle} under Vietnamese Law.`,
    };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
    const { slug } = await params;
    const policy = getPolicyBySlug(slug);

    if (!policy) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-16">

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Marketplace</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                            Student Flea Market Compliance
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Policy Content Container */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
                <article className="bg-white p-6 sm:p-12 rounded-3xl shadow-xs border border-slate-200">
                    <ReactMarkdown
                        components={{
                            h1: ({ ...props }) => (
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6 pb-4 border-b border-slate-200" {...props} />
                            ),
                            h2: ({ ...props }) => (
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-8 mb-4 tracking-tight" {...props} />
                            ),
                            h3: ({ ...props }) => (
                                <h3 className="text-base sm:text-lg font-semibold text-slate-800 mt-6 mb-3" {...props} />
                            ),
                            p: ({ ...props }) => (
                                <p className="text-slate-700 leading-relaxed mb-4 text-sm sm:text-base" {...props} />
                            ),
                            ul: ({ ...props }) => (
                                <ul className="list-disc list-inside space-y-2 mb-6 text-slate-700 pl-2 text-sm sm:text-base" {...props} />
                            ),
                            li: ({ ...props }) => (
                                <li className="text-slate-700 leading-relaxed" {...props} />
                            ),
                            strong: ({ ...props }) => (
                                <strong className="font-semibold text-slate-900" {...props} />
                            ),
                            code: ({ ...props }) => (
                                <code className="bg-slate-100 text-blue-600 px-1.5 py-0.5 rounded text-xs font-mono font-medium" {...props} />
                            ),
                        }}
                    >
                        {policy.content}
                    </ReactMarkdown>
                </article>
            </main>

        </div>
    );
}
