import { safeInternalRedirect } from "~/utils/validation";

/**
 * app/middleware/auth.ts — halaman yang butuh login.
 *
 * Pemeriksaan sesi dilakukan lewat endpoint Better Auth di server
 * (dengan cookie request), BUKAN dari state Vue.
 * Catatan: ini baru lapisan UX — endpoint server tetap wajib memvalidasi
 * sesinya sendiri (lihat server/utils/require-auth.ts).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const headers = useRequestHeaders(["cookie"]);

  const current = await $fetch<{
    session?: unknown;
    user?: { emailVerified?: boolean; email?: string } | null;
  } | null>("/api/auth/get-session", { headers }).catch(() => null);

  const user = current?.user ?? null;

  // 1. belum login → ke halaman login, bawa tujuan awalnya
  if (!user) {
    return navigateTo({
      path: "/login",
      query: { redirect: safeInternalRedirect(to.fullPath, "/dashboard") },
    });
  }

  // 2. policy: email belum terverifikasi → paksa verifikasi dulu
  if (user.emailVerified === false) {
    return navigateTo({
      path: "/verify-email",
      query: { email: user.email ?? "", reason: "unverified" },
    });
  }
});
