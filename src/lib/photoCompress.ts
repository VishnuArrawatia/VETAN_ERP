/**
 * Client-side image compression for employee photos.
 *
 * WHY: photos travel INSIDE the employee record (base64 data-URL) which lives in
 * the 5.7 MB Supabase JSON blob — every cold start, save and backup re-transfers
 * them. One uncompressed 2-3 MB mobile click multiplies every request.
 * Strategy: canvas-resize to max 400px on the long edge, JPEG quality 0.72 —
 * typical result 40-120 KB, visually fine for a 40px avatar.
 */

const MAX_EDGE = 400;
const JPEG_QUALITY = 0.72;
/** Above this size (bytes) we always recompress; below it, pass through untouched. */
const PASSTHROUGH_BELOW = 60 * 1024;

export async function compressImageDataUrl(dataUrl: string): Promise<string> {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
    // Tiny images (already-small avatars) are left as-is.
    const approxBytes = Math.round((dataUrl.length - (dataUrl.indexOf(',') + 1)) * 0.75);
    if (approxBytes < PASSTHROUGH_BELOW) return dataUrl;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image decode failed'));
      el.src = dataUrl;
    });

    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    // Safety: if compression somehow grew the payload, keep the original.
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    // Any failure = keep the original photo (never block a save on cosmetics).
    return dataUrl;
  }
}

/** Synchronous variant for worker scripts / node-side recompression (uses offscreen path in browser). */
export function isCompressiblePhoto(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('data:image') && v.length > PASSTHROUGH_BELOW;
}
