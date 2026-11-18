import fs from 'fs';
import path from 'path';

//Define the root directory where mardown policies are stored
const POLICIES_DIRECTORY = path.join(process.cwd(), 'content', 'policies');
const POLICIES_VI_DIRECTORY = path.join(POLICIES_DIRECTORY, 'vi');

/**
 * Retrieves all policy slugs for static site generation (SSG)
 */

export function getAllPolicySlugs(): string[] {
    if (!fs.existsSync(POLICIES_DIRECTORY)) {
        return [];
    }

    const files = fs.readdirSync(POLICIES_DIRECTORY);
    return files
        .filter((file) => file.endsWith('.md'))
        .map((file) => file.replace(/\.md$/, ''));

}

export interface PolicyOverviewItem {
    slug: string;
    titleVi: string;
    titleEn: string;
    summaryVi: string;
    summaryEn: string;
    contentEn: string;
    contentVi: string;
}

const POLICY_CATALOG: Array<{
    slug: string;
    titleVi: string;
    titleEn: string;
    summaryVi: string;
    summaryEn: string;
}> = [
        {
            slug: 'term-of-service',
            titleVi: 'Điều khoản sử dụng',
            titleEn: 'Terms of Service',
            summaryVi: 'Quy định sử dụng sàn, điều kiện tài khoản sinh viên và danh mục hàng hóa bị cấm.',
            summaryEn: 'Platform rules, student eligibility, intermediary role, and prohibited listings.',
        },
        {
            slug: 'privacy-policy',
            titleVi: 'Chính sách bảo mật',
            titleEn: 'Privacy Policy',
            summaryVi: 'Cam kết bảo vệ dữ liệu cá nhân sinh viên theo Nghị định 13/2023/NĐ-CP.',
            summaryEn: 'Personal data protection commitments, storage scope, and user data rights.',
        },
        {
            slug: 'refund-dispute',
            titleVi: 'Hoàn tiền & Tranh chấp',
            titleEn: 'Return, Refund & Dispute',
            summaryVi: 'Quy trình đồng kiểm, hoàn trả trong 48 giờ và hòa giải tranh chấp 3 bước.',
            summaryEn: 'Campus meetup inspection, 48-hour shipping dispute window, and 3-step mediation.',
        },
    ];

/**
 * Reads and parses a specific policy markdown file by its slug
 */
export function getPolicyBySlug(slug: string): { content: string; slug: string } | null {
    const fullPath = path.join(POLICIES_DIRECTORY, `${slug}.md`);
    if (!fs.existsSync(fullPath)) {
        return null;
    }
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return {
        slug,
        content: fileContents,
    };
}

/**
 * Reads both English and Vietnamese policy markdown contents for a slug
 */
export function getBilingualPolicyBySlug(
    slug: string
): { slug: string; contentEn: string; contentVi: string } | null {
    const enDoc = getPolicyBySlug(slug);
    if (!enDoc) return null;

    const viPath = path.join(POLICIES_VI_DIRECTORY, `${slug}.md`);
    const contentVi = fs.existsSync(viPath)
        ? fs.readFileSync(viPath, 'utf8')
        : enDoc.content;

    return {
        slug,
        contentEn: enDoc.content,
        contentVi,
    };
}

/**
 * Returns all policy documents with bilingual titles/summaries and content for Settings view
 */
export function getAllPolicies(): PolicyOverviewItem[] {
    const items: PolicyOverviewItem[] = [];

    for (const meta of POLICY_CATALOG) {
        const doc = getBilingualPolicyBySlug(meta.slug);
        if (doc) {
            items.push({
                ...meta,
                contentEn: doc.contentEn,
                contentVi: doc.contentVi,
            });
        }
    }

    return items;
}