/**
 * app/utils/auth-error.ts — menerjemahkan error auth menjadi pesan yang AMAN.
 *
 * Sumber error:
 *  - Better Auth client (`{ code, message, status }`) — kode diambil dari
 *    versi Better Auth yang terpasang (better-auth 1.7.x).
 *  - Endpoint kita (`/api/auth/otp/send`) — `{ statusCode, message, data }`.
 *
 * Aturan: JANGAN pernah menampilkan detail internal (stack trace, SQL,
 * pesan provider email mentah) ke user.
 */
import { passwordPolicy } from "./validation";

interface MaybeAuthError {
  code?: unknown;
  message?: unknown;
  status?: unknown;
  statusCode?: unknown;
  data?: unknown;
}

interface MaybeErrorBody {
  message?: unknown;
  data?: { retryAfter?: unknown } | unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

/** pesan umum dipakai bila error tidak dikenali */
export function genericAuthError(): string {
  return "Something went wrong. Please try again.";
}

/** tampilan pesan untuk respons 429 dari endpoint OTP */
export function rateLimitMessage(): string {
  return "Too many requests. Please wait a moment and try again.";
}

/**
 * Peta kode error Better Auth (1.7.x) → pesan user.
 * Lihat `@better-auth/core` BASE_ERROR_CODES & plugin `email-otp` error codes.
 */
export function mapAuthError(error: unknown): string {
  const body = asRecord(error);
  if (!body) return genericAuthError();

  const code = typeof body["code"] === "string" ? body["code"] : undefined;
  const { minLength, maxLength } = passwordPolicy();

  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
      return "E-mail or password is incorrect.";

    case "EMAIL_NOT_VERIFIED":
      return "Please verify your e-mail address before signing in.";

    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this e-mail address already exists.";

    case "INVALID_EMAIL":
      return "Please enter a valid e-mail address.";

    case "PASSWORD_TOO_SHORT":
      return `Password must be at least ${minLength} characters.`;

    case "PASSWORD_TOO_LONG":
      return `Password must not exceed ${maxLength} characters.`;

    case "OTP_EXPIRED":
      return "This code has expired. Please request a new one.";

    case "INVALID_OTP":
      return "The code is incorrect. Please check and try again.";

    case "TOO_MANY_ATTEMPTS":
      return "Too many attempts. Please request a new code.";

    case "USER_NOT_FOUND":
      // sengaja umum agar tidak membocorkan keberadaan akun
      return genericAuthError();

    case "RATE_LIMIT_NETWORK":
    case "TOO_MANY_REQUESTS":
      return rateLimitMessage();

    case "EMAIL_PASSWORD_SIGN_UP_DISABLED":
      return "Registration is currently disabled.";

    default:
      break;
  }

  // fallback berdasarkan status HTTP (lebih aman daripada pesan mentah)
  const statusCode =
    typeof body["statusCode"] === "number"
      ? body["statusCode"]
      : typeof body["status"] === "number"
        ? body["status"]
        : undefined;

  if (statusCode === 429) return rateLimitMessage();
  if (statusCode === 401) return "E-mail or password is incorrect.";
  if (statusCode === 403) return "You do not have permission to do that.";
  if (statusCode === 400) return "Please check your input and try again.";
  if (statusCode && statusCode >= 500) {
    return "The service is temporarily unavailable. Please try again later.";
  }

  return genericAuthError();
}

/** ambil pesan aman dari error `$fetch` (termasuk error endpoint OTP kita) */
export function mapFetchError(error: unknown): string {
  const record = asRecord(error);
  if (!record) return genericAuthError();

  // error dari endpoint kita: { statusCode, message, data: { retryAfter } }
  const statusCode =
    typeof record["statusCode"] === "number" ? record["statusCode"] : undefined;
  const nested = asRecord(record["data"]);
  const message = nested
    ? typeof nested["message"] === "string"
      ? nested["message"]
      : undefined
    : typeof record["message"] === "string"
      ? record["message"]
      : undefined;

  if (statusCode === 429) {
    return message ?? rateLimitMessage();
  }
  if (statusCode && statusCode >= 400) {
    return message ?? genericAuthError();
  }

  // jaringan putus / offline
  return "Network error. Please check your connection and try again.";
}

/** sisa waktu tunggu (detik) dari error 429 endpoint OTP, bila ada */
export function retryAfterFromError(error: unknown): number | null {
  const record = asRecord(error);
  if (!record) return null;

  const nested = asRecord(record["data"]);
  const body = nested ?? record;
  const retryAfter = asRecord(body)?.["retryAfter"];

  return typeof retryAfter === "number" && retryAfter > 0 ? retryAfter : null;
}
