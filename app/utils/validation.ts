/**
 * app/utils/validation.ts — helper validasi reusable di client.
 *
 * Penting: validasi client hanya mempercepat feedback user.
 * Server (Better Auth + endpoint) tetap memvalidasi ulang semua input.
 */

/** kebijakan password dari runtimeConfig.public (sumber: lib/auth-config.ts) */
export function passwordPolicy(): { minLength: number; maxLength: number } {
  const policy = useRuntimeConfig().public.password as
    | { minLength?: number; maxLength?: number }
    | undefined;

  return {
    minLength: policy?.minLength ?? 8,
    maxLength: policy?.maxLength ?? 128,
  };
}

/** pengaturan OTP dari runtimeConfig.public */
export function otpSettings(): { length: number; resendCooldownSeconds: number } {
  const settings = useRuntimeConfig().public.otp as
    | { length?: number; resendCooldownSeconds?: number }
    | undefined;

  return {
    length: settings?.length ?? 6,
    resendCooldownSeconds: settings?.resendCooldownSeconds ?? 60,
  };
}

/** rapikan email: buang spasi + huruf kecil semua */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** cek format email (cukup untuk UX; server tetap validasi) */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

/** validasi password; kembalikan pesan error atau `null` bila lolos */
export function passwordError(value: string): string | null {
  const { minLength, maxLength } = passwordPolicy();

  if (!value) return "Please enter your password.";
  if (value.length < minLength) {
    return `Use at least ${minLength} characters for your password.`;
  }
  if (value.length > maxLength) {
    return `Password must not exceed ${maxLength} characters.`;
  }
  return null;
}

/** validasi konfirmasi password; kembalikan pesan error atau `null` */
export function passwordConfirmationError(
  password: string,
  confirmation: string,
): string | null {
  if (!confirmation) return "Please confirm your password.";
  if (password !== confirmation) return "The passwords do not match.";
  return null;
}

/** ambil hanya digit dari input OTP */
export function normalizeOtp(value: string): string {
  return value.replace(/\D+/g, "");
}

/** cek panjang/format OTP sesuai konfigurasi */
export function isValidOtpFormat(value: string, length?: number): boolean {
  const { length: otpLength } = otpSettings();
  return /^\d+$/.test(value) && value.length === (length ?? otpLength);
}

/** redirect aman: hanya path internal (tolak `//evil.com` / URL absolut) */
export function safeInternalRedirect(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
