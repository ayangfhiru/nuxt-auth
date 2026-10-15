import { createAuthClient } from "better-auth/vue";
import { emailOTPClient } from "better-auth/client/plugins";

/**
 * app/lib/auth-client.ts — konfigurasi Better Auth di sisi browser.
 *
 * Catatan penting:
 *  - `baseURL` TIDAK diisi hardcode. Saat di browser, Better Auth otomatis
 *    memakai `window.location.origin` → aman untuk dev, production, maupun
 *    di belakang proxy. Request selalu same-origin ke `/api/auth/*`.
 *  - Plugin `emailOTPClient()` memberi method `authClient.emailOtp.*`
 *    (verifyEmail, resetPassword, ...) sesuai versi Better Auth terpasang.
 *  - Semua rahasia (secret, SMTP, dsb.) TIDAK boleh masuk file ini.
 */
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
