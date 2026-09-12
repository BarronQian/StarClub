/**
 * Vercel enforces a hard, non-configurable request body limit of 4.5MB
 * (4,500,000 bytes) on Node.js Serverless Functions — the runtime this
 * upload route runs on. That limit is enforced by the platform in front
 * of the function, before any application code runs, so it cannot be
 * raised via `next.config`, `vercel.json`, or an in-route check.
 *
 * MAX_UPLOAD_BYTES is kept slightly below that ceiling to leave headroom
 * for multipart/form-data overhead (boundary markers, field headers,
 * filename) so a file that is just under the limit doesn't get pushed
 * over it once wrapped in the upload request.
 */
export const PLATFORM_BODY_LIMIT_BYTES = 4_500_000
export const MAX_UPLOAD_BYTES = 4_300_000

export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(mb < 10 ? 2 : 1)} MB`
}
