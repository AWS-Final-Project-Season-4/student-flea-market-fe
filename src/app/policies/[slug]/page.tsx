import { notFound } from 'next/navigation';
import { getAllPolicySlugs, getPolicyBySlug } from '@/lib/policies';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';

interface PolicyPageProps {
    params: Promise<{
        slug: string;
    }>;
}

/**
 * Pre-renders all policy routes at build time for optimal enterprise performance
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
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <article className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-100">
                <ReactMarkdown
                    components={{
                        h1: ({ node, ...props }) => (
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 pb-4 border-b border-gray-200" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 tracking-tight" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                            <p className="text-gray-700 leading-relaxed mb-4 text-base" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700 pl-2" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                            <li className="text-gray-700 leading-relaxed" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                            <strong className="font-semibold text-gray-900" {...props} />
                        ),
                        code: ({ node, ...props }) => (
                            <code className="bg-gray-100 text-indigo-600 px-1.5 py-0.5 rounded text-sm font-mono font-medium" {...props} />
                        ),
                    }}
                >
                    {policy.content}
                </ReactMarkdown>
            </article>
        </div>
    );
}
