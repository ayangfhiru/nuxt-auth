import { z } from "zod";
import { getEmailProvider } from "~~/lib/email/email-provider";
import { sendOtpEmail } from "~~/lib/email/send-otp";
import { authConfig } from "~~/lib/auth-config";
import { auth } from "~~/server/utils/auth";
import { prisma } from "~~/server/utils/db";
import { rateLimitHit } from "~~/server/utils/rate-limit";

/**
 * POST /api/auth/otp/send — kirim / kirim ulang kode OTP.
 *
 * Mengapa endpoint sendiri, bukan langsung `/api/auth/email-otp/send-verification-otp`?
 * Karena kebutuhan flow di docs/AUTH_FLOW.md §3.4 tidak dimiliki plugin:
 *
 *   1. COOLDOWN per-email (60 dtk) → dicek lewat `Verification.createdAt`,
 *      jadi client TIDAK bisa mematikan cooldown-nya.
 *   2. Kejujuran pesan gagal → konektivitas provider dicek dulu, dan pengiriman
 *      ditunggu hasilnya, sehingga respons {success:true} benar-benar berarti
 *      "email terkirim" (bukan "permintaan diterima").
 *   3. Anti-enumeration → respons identik baik akun ada maupun tidak.
 *   4. Kebijakan rotasi → kode lama dihapus dulu (delete-then-create), sehingga
 *      hanya SATU kode aktif per email+tipe (konsisten dengan `resendStrategy`).
 *
 * Tipe yang diizinkan dibatasi: hanya email-verification & forget-password —
 * sengaja TIDAK mencampur dengan OTP sign-in / MFA (docs/AUTH_FLOW.md §3.3).
 */
const bodySchema = z.object({
  email: z.string().trim().toLowerCase(),
  type: z.enum(["email-verification", "forget-password"]),
});

const IP_LIMIT = { max: 5, windowMs: 60_000 };
const EMAIL_LIMIT = { max: 3, windowMs: 60_000 };

/** format identifier OTP milik Better Auth: `${type}-otp-${email}` */
function otpIdentifier(type: string, email: string): string {
  return `${type}-otp-${email}`;
}

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event).catch(() => null));

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Please provide a valid e-mail address and OTP type.",
    });
  }

  const { email, type } = parsed.data;
  const cooldownMs = authConfig.otp.resendCooldown * 1000;

  /* 1. batas per-IP (melindungi dari spam dari satu sumber) */
  const ip = getHeader(event, "x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipLimit = rateLimitHit(`otp-send:ip:${ip}`, IP_LIMIT.max, IP_LIMIT.windowMs);
  if (!ipLimit.allowed) {
    throw tooManyRequests(ipLimit.retryAfter);
  }

  /* 2. batas per-email (melindungi inbox satu alamat) */
  const emailLimit = rateLimitHit(
    `otp-send:email:${type}:${email}`,
    EMAIL_LIMIT.max,
    EMAIL_LIMIT.windowMs,
  );
  if (!emailLimit.allowed) {
    throw tooManyRequests(emailLimit.retryAfter);
  }

  /* 3. cooldown per-email: kode terakhir dibuat kapan? */
  const identifier = otpIdentifier(type, email);
  const lastOtp = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });

  if (lastOtp) {
    const ageMs = Date.now() - lastOtp.createdAt.getTime();
    if (ageMs < cooldownMs) {
      throw tooManyRequests(Math.max(1, Math.ceil((cooldownMs - ageMs) / 1000)));
    }
  }

  /* 4. anti-enumeration: akun tidak ada → tetap sukses, tanpa mengirim apa pun */
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: true, cooldown: authConfig.otp.resendCooldown };
  }

  /* 5. cek provider dulu supaya kode lama tidak terbuang saat email gagal */
  const provider = getEmailProvider();
  try {
    await provider.verify();
  } catch (error) {
    console.error(
      `[email] Provider (${provider.name}) tidak terjangkau:`,
      error instanceof Error ? error.message : error,
    );
    throw createError({
      statusCode: 503,
      statusMessage: "Email service unavailable",
      message: "The e-mail service is temporarily unavailable. Please try again later.",
    });
  }

  /* 6. rotasi: hapus kode lama, buat kode baru (lebih baik resmi dari Better Auth) */
  await prisma.verification.deleteMany({ where: { identifier } });

  let otp: string;
  try {
    otp = await auth.api.createVerificationOTP({
      body: { email, type },
    });
  } catch (error) {
    console.error(
      "[otp] Gagal membuat kode OTP:",
      error instanceof Error ? error.message : error,
    );
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "We could not create a verification code. Please try again.",
    });
  }

  /* 7. kirim — hasilnya DITUNGGU, sehingga gagal = respons gagal */
  try {
    await sendOtpEmail({ email, otp, type });
  } catch (error) {
    console.error(
      "[otp] Gagal mengirim kode OTP:",
      error instanceof Error ? error.message : error,
    );
    throw createError({
      statusCode: 502,
      statusMessage: "Email delivery failed",
      message: "We could not send the code. Please try again.",
    });
  }

  return { success: true, cooldown: authConfig.otp.resendCooldown };
});

/** respons 429 standar dengan sisa waktu tunggu (detik) */
function tooManyRequests(retryAfter: number) {
  return createError({
    statusCode: 429,
    statusMessage: "Too Many Requests",
    message: "Please wait before requesting another code.",
    data: { retryAfter },
  });
}
