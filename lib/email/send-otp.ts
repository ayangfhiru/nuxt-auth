/**
 * lib/email/send-otp.ts — jembatan dari Better Auth plugin `email-otp` ke email provider.
 *
 * Fungsi ini dipakai langsung sebagai callback plugin:
 *
 *     emailOTP({ sendVerificationOTP: sendOtpEmail, ... })
 *
 * Aturan:
 *  - TIDAK pernah mencetak kode OTP / password ke log (docs/AUTH_FLOW.md §3.1, §12).
 *  - Provider gagal → MELEMPAR error supaya tidak pernah mengaku "email terkirim".
 */
import { authConfig } from "../auth-config";
import { getEmailProvider } from "./email-provider";
import { renderOtpEmail, type OtpEmailType } from "./templates";

/**
 * Tipe callback plugin diambil dari package `better-auth` yang terpasang,
 * bukan disalin dari dokumentasi versi lain (docs/AUTH_FLOW.md §7).
 */
export type SendVerificationOTP = Parameters<
  typeof import("better-auth/plugins").emailOTP
>[0]["sendVerificationOTP"];

/** data yang dikirim Better Auth saat meminta email OTP dikirim */
export interface SendOtpData {
  email: string;
  otp: string;
  type: OtpEmailType;
}

/**
 * Callback pengiriman OTP untuk Better Auth.
 *
 * @throws {EmailDeliveryError} bila provider tidak bisa mengirim.
 */
export const sendOtpEmail: SendVerificationOTP = async (data: SendOtpData) => {
  const template = renderOtpEmail({
    email: data.email,
    otp: data.otp,
    type: data.type,
    expiresInMinutes: Math.max(1, Math.round(authConfig.otp.expiresIn / 60)),
    appName: authConfig.app.name,
  });

  const provider = getEmailProvider();

  try {
    await provider.send({
      from: authConfig.email.from,
      to: data.email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  } catch (error) {
    // log aman: hanya pesan error provider, TANPA kode OTP
    console.error(
      `[email] Gagal mengirim email OTP (${provider.name}) ke ${data.email}:`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};
