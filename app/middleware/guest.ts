/**
 * app/middleware/guest.ts — halaman yang hanya untuk tamu
 * (login, register, verifikasi, lupa & reset password).
 *
 * Bila sudah ada sesi valid, user langsung diarahkan ke dashboard.
 */
export default defineNuxtRouteMiddleware(async () => {
  const headers = useRequestHeaders(["cookie"]);

  const current = await $fetch<{
    user?: { emailVerified?: boolean } | null;
  } | null>("/api/auth/get-session", { headers }).catch(() => null);

  if (current?.user && current.user.emailVerified !== false) {
    return navigateTo("/dashboard");
  }
});
