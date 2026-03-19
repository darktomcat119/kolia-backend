/**
 * File upload: Cloudflare R2 (S3-compatible) or Supabase Storage.
 * Default is Supabase Storage. Configure via UPLOAD_PROVIDER (supabase | r2).
 */

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { supabaseAdmin } from './supabase.js';

const UPLOAD_BUCKET_SUPABASE = process.env.SUPABASE_STORAGE_BUCKET || 'kolia-images';
const UPLOAD_PROVIDER = (process.env.UPLOAD_PROVIDER || 'supabase').toLowerCase();
const USE_R2 = UPLOAD_PROVIDER === 'r2';

function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

const r2Client = USE_R2 ? getR2Client() : null;
const r2Bucket = process.env.R2_BUCKET_NAME || 'kolia-images';
const publicBaseUrl = (process.env.FILE_UPLOAD_PUBLIC_URL || '').replace(/\/$/, '');

export type UploadResult = { url: string };

/**
 * Upload a restaurant image (cover, logo, gallery). Uses R2 if configured, else Supabase Storage.
 * path: e.g. "restaurant/cover-1234567890-abc123.jpg"
 */
export async function uploadRestaurantImage(
  buffer: Buffer,
  contentType: string,
  path: string
): Promise<UploadResult> {
  if (USE_R2) {
    if (!r2Client || !publicBaseUrl) {
      throw new Error(
        'R2 upload configured (UPLOAD_PROVIDER=r2) but missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, or FILE_UPLOAD_PUBLIC_URL'
      );
    }
    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: path,
        Body: buffer,
        ContentType: contentType,
      })
    );
    const url = `${publicBaseUrl}/${path}`;
    return { url };
  }

  // Supabase Storage fallback
  const { error } = await supabaseAdmin.storage
    .from(UPLOAD_BUCKET_SUPABASE)
    .upload(path, buffer, { contentType, upsert: false });

  if (error) throw new Error(error.message || 'Upload failed');

  const { data: urlData } = supabaseAdmin.storage.from(UPLOAD_BUCKET_SUPABASE).getPublicUrl(path);
  return { url: urlData.publicUrl };
}
