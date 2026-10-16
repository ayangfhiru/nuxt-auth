/**
 * server/plugins/auth-startup.ts — pemeriksaan konfigurasi saat server boot.
 *
 * Tujuannya satu: gagal SEGERA dan JELAS bila konfigurasi auth belum lengkap
 * (lihat lib/env.ts), bukan error aneh di tengah request.
 */
import { authConfig } from "~~/lib/auth-config";
import { validateAuthEnv } from "~~/lib/env";

export default defineNitroPlugin(() => {
  // melempar error lengkap bila ada variabel esensial yang kosong
  validateAuthEnv();

  const { otp, password, session, email } = authConfig;

  console.info(
    `[auth] Konfigurasi OK — penyedia email: ${email.provider}, ` +
      `OTP ${otp.length} digit (berlaku ${otp.expiresIn}s, cooldown ${otp.resendCooldown}s, ` +
      `maks ${otp.maxAttempts} percobaan), password ${password.minLength}-${password.maxLength} karakter, ` +
      `sesi ${Math.round(session.expiresIn / 86400)} hari.`,
  );
});
