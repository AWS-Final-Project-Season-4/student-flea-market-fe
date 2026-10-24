export interface PolicyMetadata {
    title: string;
    version: string;
    lastUpdated: string;
    description: string;
}

export interface PolicyDocument {
    slug: string;
    metadata: PolicyMetadata;
    content: string;
}