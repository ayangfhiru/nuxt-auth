import { requireVerifiedSession } from "~~/server/utils/require-auth";

/**
 * GET /api/me — contoh endpoint yang DILINDUNGI server.
 *
 * Sesi divalidasi di server melalui cookie request (bukan state Vue),
 * dan mengikuti kebijakan "email wajib terverifikasi".
 *
 * 401 = belum login, 403 = login tapi email belum terverifikasi.
 */
export default defineEventHandler(async (event) => {
  const session = await requireVerifiedSession(event);

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      image: session.user.image ?? null,
      createdAt: session.user.createdAt,
    },
    session: {
      expiresAt: session.session.expiresAt,
    },
  };
});
