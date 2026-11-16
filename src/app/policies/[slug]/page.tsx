///////////////////////////////////////////////////////////
//                                                       //
//                 POLICY DOCUMENT PAGE                  //
//                                                       //
///////////////////////////////////////////////////////////

import { notFound } from 'next/navigation';
import { getAllPolicySlugs, getBilingualPolicyBySlug } from '@/lib/policies';
import { Metadata } from 'next';
import { PolicyDetailClient } from './PolicyDetailClient';

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
    const policy = getBilingualPolicyBySlug(slug);

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
    const policy = getBilingualPolicyBySlug(slug);

    if (!policy) {
        notFound();
    }

    return (
        <PolicyDetailClient
            contentEn={policy.contentEn}
            contentVi={policy.contentVi}
        />
    );
}
