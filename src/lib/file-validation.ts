/**
 * Server-side File Metadata Validation Utility
 * Validates upload metadata (file_url, file_size_kb, file_type, file_name)
 */

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
] as const;

export const MAX_FILE_SIZE_KB = 10240; // 10 MB limit

export interface FileMetadataInput {
  file_url?: string;
  file_size_kb?: number;
  file_type?: string;
  file_name?: string;
}

export function validateFileMetadata(
  input: FileMetadataInput,
  options: {
    allowedTypes?: readonly string[];
    maxSizeKb?: number;
    bucketPattern?: RegExp | string;
  } = {}
): { valid: boolean; error?: string } {
  const allowedTypes = options.allowedTypes || ALLOWED_FILE_TYPES;
  const maxSizeKb = options.maxSizeKb || MAX_FILE_SIZE_KB;
  const bucketPattern = options.bucketPattern || /\/(storage\/v1\/object\/public|uploads|evidence|kyc|resumes|docs)\//i;

  if (input.file_type && !allowedTypes.includes(input.file_type.toLowerCase())) {
    return { valid: false, error: `Invalid file_type '${input.file_type}'. Allowed types: ${allowedTypes.join(', ')}` };
  }

  if (
    input.file_size_kb !== undefined &&
    (typeof input.file_size_kb !== 'number' || input.file_size_kb > maxSizeKb || input.file_size_kb <= 0)
  ) {
    return { valid: false, error: `Invalid file_size_kb. Maximum permitted file size is ${maxSizeKb} KB.` };
  }

  if (input.file_url) {
    try {
      const parsed = new URL(input.file_url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, error: 'file_url must use HTTP or HTTPS protocol.' };
      }
      if (typeof bucketPattern === 'string') {
        if (!input.file_url.includes(bucketPattern)) {
          return {
            valid: false,
            error: `file_url does not belong to expected storage bucket path '${bucketPattern}'.`
          };
        }
      } else if (!bucketPattern.test(input.file_url)) {
        return { valid: false, error: 'file_url does not match expected storage bucket pattern.' };
      }
    } catch {
      return { valid: false, error: 'Invalid file_url format.' };
    }
  }

  return { valid: true };
}
