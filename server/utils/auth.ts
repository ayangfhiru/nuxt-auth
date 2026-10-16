import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { authConfig } from "~~/lib/auth-config";
import { sendOtpEmail } from "~~/lib/email/send-otp";
import { validateAuthEnv } from "~~/lib/env";
import { prisma } from "./db";

// fail-fast: bila secret/url/db/provider email belum diatur, error jelas muncul
// sebelum konfigurasi Better Auth sempat terbentuk.
validateAuthEnv();

/** origin development yang sah (dev server Nuxt) */
const devOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

const trustedOrigins = [
  ...new Set([
    authConfig.app.url,
    authConfig.baseURL,
    ...(authConfig.isProduction ? [] : devOrigins),
  ]),
];

export const auth = betterAuth({
  secret: authConfig.secret,
  baseURL: authConfig.baseURL,
  trustedOrigins,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    // policy: akun yang emailnya belum diverifikasi TIDAK bisa login
    requireEmailVerification: true,
    // sesuai flow: register → verifikasi OTP → login (tanpa sesi otomatis)
    autoSignIn: false,
    minPasswordLength: authConfig.password.minLength,
    maxPasswordLength: authConfig.password.maxLength,
    // reset password → cabut semua sesi lama (kebijakan invalidasi sesi)
    revokeSessionsOnPasswordReset: true,
  },

  session: {
    // detik: 7 hari, diperbarui tiap 24 jam
    expiresIn: authConfig.session.expiresIn,
    updateAge: authConfig.session.updateAge,
  },

  rateLimit: {
    // aktif di semua environment (bukan hanya production)
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      // batasi endpoint yang memicu email / membuka akses
      "/sign-up/email": { window: 60, max: 5 },
      "/sign-in/email": { window: 60, max: 10 },
      // sesi dicek di banyak halaman, jangan dibatasi
      "/get-session": false,
    },
  },

  plugins: [
    emailOTP({
      // callback pengiriman email (lihat lib/email/send-otp.ts)
      sendVerificationOTP: sendOtpEmail,
      otpLength: authConfig.otp.length,
      expiresIn: authConfig.otp.expiresIn,
      allowedAttempts: authConfig.otp.maxAttempts,
      // kode disimpan ter-hash di tabel Verification (bukan plaintext)
      storeOTP: "hashed",
      // kirim ulang = kode baru, kode lama langsung tidak berlaku
      resendStrategy: "rotate",
      // OTP menggantikan alur verifikasi email via link token
      overrideDefaultEmailVerification: true,
      // batasi permintaan kode (per IP) selain cooldown per-email di endpoint kita
      rateLimit: { window: 60, max: 3 },
    }),
  ],

  socialProviders: {
    google: {
      clientId: authConfig.google.clientId,
      clientSecret: authConfig.google.clientSecret,
    },
  },
});
