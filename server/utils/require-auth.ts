import type { H3Event } from "h3";
import { createError } from "h3";
import { getSession, type Session } from "./auth-session";

/**
 * server/utils/require-auth.ts — guard reusable untuk endpoint server.
 *
 * Dipakai di endpoint yang butuh login (lihat server/api/me.get.ts).
 * Middleware Vue TIDAK cukup untuk melindungi API.
 */

/** tolak request tanpa sesi valid (401) */
export async function requireSession(event: H3Event): Promise<Session> {
  const session = await getSession(event);

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "You must be signed in to access this resource.",
    });
  }

  return session;
}

/**
 * tolak request tanpa sesi valid ATAU dari email yang belum diverifikasi (403).
 * Dipakai untuk fitur yang menuntut kebijakan "email wajib terverifikasi".
 */
export async function requireVerifiedSession(event: H3Event): Promise<Session> {
  const session = await requireSession(event);

  if (!session.user.emailVerified) {
    throw createError({
      statusCode: 403,
      statusMessage: "Email not verified",
      message: "Please verify your email address to continue.",
    });
  }

  return session;
}
