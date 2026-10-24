import fs from 'fs';
import path from 'path';

//Define the root directory where mardown policies are stored
const POLICIES_DIRECTORY = path.join(process.cwd(), 'content', 'policies');

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