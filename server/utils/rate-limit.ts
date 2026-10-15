/**
 * server/utils/rate-limit.ts — pembatas laju sederhana di memori (per-instance).
 *
 * Dipakai oleh endpoint kirim/ resend OTP sebagai lapisan proteksi tambahan
 * selain rate limit bawaan Better Auth (yang hanya mencakup path `/api/auth/*`).
 *
 * Catatan: penyimpanan in-memory berarti batas berlaku per proses server —
 * cukup untuk satu instance dev/produksi kecil. Bila nanti berjalan multi-instance,
 * ganti penyimpanannya dengan Redis/dst. (terdokumentasi di docs/AUTH_FLOW.md).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** bersihkan bucket yang sudah kedaluwarsa (dipanggil Opportunistik) */
function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** detik sampai izin berikutnya tersedia (hanya bila ditolak) */
  retryAfter: number;
}

/**
 * catat satu permintaan untuk `key`; `limit` kali per `windowMs`.
 * Mengembalikan apakah permintaan diizinkan + sisa waktu tunggu.
 */
export function rateLimitHit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}
