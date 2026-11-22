// ============================================================== //
//            S3 IMAGE UPLOAD (presigned POST, direct to S3)       //
// ============================================================== //
// Flow: presign (API) -> browser POSTs the file straight to S3 (raw/, private)
// -> confirm (API). The Lambda ImageProcessor then writes WebP versions to
// processed/ behind CloudFront, so a confirmed URL can 403/404 for a few seconds.

import { apiClient } from './api-client';
import type { UserDto } from '@/types/auth';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_ITEM_IMAGE_BYTES = 10 * 1024 * 1024; // MediaStorage:MaxFileSizeBytes
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_ITEM = 8; // MediaStorage:MaxImagesPerItem

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

interface PresignedUpload {
  uploadId: string;
  objectKey: string;
  uploadUrl: string;
  method: string;
  formFields: Record<string, string>;
  expectedSizeBytes: number;
  expiresAt: string;
}

export interface ConfirmedItemImage {
  id: string;
  uploadId: string;
  imageUrl: string;
  thumbnailUrl: string;
  isPrimary: boolean;
  order: number;
}

/** Returns an error message (en) when the file cannot be uploaded, otherwise null. */
export function validateImageFile(file: File, maxBytes: number): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Only JPG, PNG or WebP images are allowed.';
  }
  if (file.size > maxBytes) {
    return `Image must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.`;
  }
  return null;
}

/**
 * The backend checks that the extension matches the content type, so send a
 * normalised name (".jfif", ".JPG" or no extension would otherwise be rejected).
 */
function normalisedName(file: File, index: number, prefix: string): string {
  return `${prefix}-${index + 1}.${EXT_BY_TYPE[file.type] ?? 'jpg'}`;
}

async function postToS3(upload: PresignedUpload, file: File): Promise<void> {
  const form = new FormData();
  Object.entries(upload.formFields).forEach(([k, v]) => form.append(k, v));
  form.append('file', file); // must be the last field
  const res = await fetch(upload.uploadUrl, { method: upload.method || 'POST', body: form });
  if (!res.ok) {
    throw new Error(`Uploading "${file.name}" failed (S3 ${res.status}).`);
  }
}

/** Uploads images for an item the current user owns. The first image becomes primary if none exists. */
export async function uploadItemImages(itemId: string, files: File[]): Promise<ConfirmedItemImage[]> {
  if (!files.length) return [];
  const { data } = await apiClient.post<{ uploads: PresignedUpload[] }>(
    `/Items/sell/${itemId}/images/presign`,
    {
      files: files.map((f, i) => ({
        fileName: normalisedName(f, i, 'image'),
        contentType: f.type,
        sizeBytes: f.size,
      })),
    }
  );
  await Promise.all(data.uploads.map((u, i) => postToS3(u, files[i])));
  const confirmed = await apiClient.post<{ images: ConfirmedItemImage[] }>(
    `/Items/sell/${itemId}/images/confirm`,
    { objectKeys: data.uploads.map((u) => u.objectKey) }
  );
  return confirmed.data.images;
}

/** Uploads a new avatar and returns the updated user (avatarUrl points to the processed CloudFront image). */
export async function uploadAvatar(file: File): Promise<UserDto> {
  const { data: u } = await apiClient.post<PresignedUpload>('/Profile/avatar/presign', {
    fileName: normalisedName(file, 0, 'avatar'),
    contentType: file.type,
    sizeBytes: file.size,
  });
  await postToS3(u, file);
  const { data } = await apiClient.post<UserDto>('/Profile/avatar/confirm', { objectKey: u.objectKey });
  return data;
}

export async function removeAvatar(): Promise<UserDto> {
  const { data } = await apiClient.delete<UserDto>('/Profile/avatar');
  return data;
}

/** Resolves true once the processed image is reachable (Lambda finished), or false after ~20 s. */
export function waitForImage(url: string, attempts = 10, delayMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    let n = 0;
    const tryOnce = () => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => (++n >= attempts ? resolve(false) : window.setTimeout(tryOnce, delayMs));
      img.src = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
    };
    tryOnce();
  });
}
