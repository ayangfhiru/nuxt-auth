/**
 * lib/auth-config.ts — SATU sumber kebenaran untuk konfigurasi authentication.
 *
 * Semua nilai dibaca dari environment variable dengan default yang terdokumentasi
 * (lihat `.env.example` dan `docs/AUTH_FLOW.md`). Modul ini:
 *
 *  - dipakai `server/utils/auth.ts`  → diterjemahkan ke opsi Better Auth
 *  - dipakai `nuxt.config.ts`        → hanya `publicAuthConfig` (tanpa rahasia)
 *  - dipakai endpoint resend/OTP     → cooldown, batas percobaan, dsb.
 *
 * PENTING: modul ini TIDAK boleh di-import dari kode client (app/) —
 * client hanya menerima potongan aman lewat `runtimeConfig.public`.
 */

/** nama provider email yang didukung */
export type EmailProviderName = "smtp";

/** ambil string dari env (kosong/absen → fallback) */
function str(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

/** ambil integer positif dari env; nilai tidak valid → error jelas */
function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `[auth-config] Variabel ${name} harus berupa bilangan bulat positif, dapat "${raw}".`,
    );
  }
  return parsed;
}

/** ambil boolean sederhana ("true"/"false") dari env */
function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;

  const normalized = raw.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;

  throw new Error(
    `[auth-config] Variabel ${name} harus true/false, dapat "${raw}".`,
  );
}

const isProduction = process.env.NODE_ENV === "production";

/* ------------------------------------------------------------------ *
 * Aplikasi (juga dipakai sebagai trusted origin & baseURL Better Auth)
 * ------------------------------------------------------------------ */
const appName = str("NUXT_PUBLIC_APP_NAME", "AuthOra");
const appUrl = str(
  "NUXT_PUBLIC_APP_URL",
  str("BETTER_AUTH_URL", "http://localhost:3000"),
);

/* ---------------------------------- *
 * OTP (plugin Better Auth `email-otp`)
 * ---------------------------------- */
const otp = {
  /** jumlah digit kode */
  length: int("AUTH_OTP_LENGTH", 6),
  /** masa berlaku kode, detik (Better Auth: `expiresIn`) */
  expiresIn: int("AUTH_OTP_EXPIRES_IN", 300),
  /** jeda minimal antar pengiriman ulang, detik (diatur sendiri di endpoint) */
  resendCooldown: int("AUTH_OTP_RESEND_COOLDOWN", 60),
  /** maksimal percobaan salah sebelum kode diblokir (Better Auth: `allowedAttempts`) */
  maxAttempts: int("AUTH_OTP_MAX_ATTEMPTS", 5),
};

/* ------------------------ *
 * Kebijakan password & sesi
 * ------------------------ */
const password = {
  minLength: int("AUTH_PASSWORD_MIN_LENGTH", 8),
  maxLength: int("AUTH_PASSWORD_MAX_LENGTH", 128),
};

const session = {
  /** masa berlaku sesi, detik (Better Auth: `session.expiresIn`) */
  expiresIn: int("AUTH_SESSION_EXPIRES_IN", 60 * 60 * 24 * 7),
  /** seberapa sering sesi diperbarui, detik (Better Auth: `session.updateAge`) */
  updateAge: int("AUTH_SESSION_UPDATE_AGE", 60 * 60 * 24),
};

/* ------------------------------- *
 * Penyedia email (Nodemailer/SMTP)
 * ------------------------------- */
const email = {
  provider: str("EMAIL_PROVIDER", "smtp") as EmailProviderName,
  from: str("EMAIL_FROM", "AuthOra <no-reply@localhost>"),
  smtp: {
    host: str("SMTP_HOST", ""),
    port: int("SMTP_PORT", 587),
    secure: bool("SMTP_SECURE", false),
    user: str("SMTP_USER", ""),
    password: str("SMTP_PASSWORD", ""),
  },
};

const google = {
  clientId: str("GOOLE_CLIENT_ID", ""),
  clientSecret: str("GOOGLE_CLIENT_SECRET", ""),
};

/* ------------------------------------------------------------------ *
 * Konfigurasi utuh (server) — berisi rahasia, JANGAN pernah diekspor
 * ke runtimeConfig.public.
 * ------------------------------------------------------------------ */
export const authConfig = {
  isProduction,
  app: { name: appName, url: appUrl },
  /** BETTER_AUTH_SECRET */
  secret: str("BETTER_AUTH_SECRET", ""),
  /** BETTER_AUTH_URL */
  baseURL: str("BETTER_AUTH_URL", ""),
  otp,
  password,
  session,
  email,
  google,
} as const;

/**
 * Potongan yang AMAN dikirim ke browser lewat `runtimeConfig.public`.
 * Hanya dipakai untuk validasi UX (panjang password/OTP, countdown, nama app) —
 * tidak ada rahasia di sini.
 */
export const publicAuthConfig = {
  appName,
  appUrl,
  password: {
    minLength: password.minLength,
    maxLength: password.maxLength,
  },
  otp: {
    length: otp.length,
    resendCooldownSeconds: otp.resendCooldown,
  },
} as const;

export type AuthConfig = typeof authConfig;
export type PublicAuthConfig = typeof publicAuthConfig;
