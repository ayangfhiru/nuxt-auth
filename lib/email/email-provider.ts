/**
 * lib/email/email-provider.ts — abstraksi penyedia email.
 *
 * Kenapa memilih Nodemailer (SMTP)?
 *  - `nodemailer` SUDAH menjadi dependency proyek ini (package.json),
 *    jadi tidak menambah dependency baru (lihat docs/AUTH_FLOW.md bagian Email).
 *  - Agar provider bisa ditukar (mis. Resend) nanti, semua detail provider
 *    dikurung di belakang interface `EmailProvider`; logika auth tidak berubah.
 */
import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import { authConfig } from "../auth-config";

/** pesan email yang akan dikirim (provider tidak perlu tahu soal OTP) */
export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** kontrak minimal penyedia email */
export interface EmailProvider {
  /** nama untuk logging, mis. "smtp" */
  readonly name: string;
  /** cek konektivitas ke server email (untuk pesan error yang jujur) */
  verify(): Promise<void>;
  /** kirim email; MELEMPAR error bila provider gagal */
  send(message: EmailMessage): Promise<void>;
}

/**
 * Error khusus pengiriman email.
 * Pesannya sengaja umum (tanpa detail internal) agar aman ditampilkan ke user.
 */
export class EmailDeliveryError extends Error {
  constructor(cause?: unknown) {
    super("Email provider gagal mengirim pesan.");
    this.name = "EmailDeliveryError";
    if (cause !== undefined) this.cause = cause;
  }
}

/** implementasi SMTP memakai Nodemailer */
function createSmtpProvider(): EmailProvider {
  const { smtp, from } = authConfig.email;

  const transport: Transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    // auth hanya dikirim bila user diisi (server lokal/testing tidak butuh)
    auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return {
    name: "smtp",
    async verify() {
      try {
        await transport.verify();
      } catch (error) {
        throw new EmailDeliveryError(error);
      }
    },
    async send(message: EmailMessage) {
      try {
        await transport.sendMail({ ...message, from: message.from || from });
      } catch (error) {
        throw new EmailDeliveryError(error);
      }
    },
  };
}

let cached: EmailProvider | null = null;

/** singleton penyedia email (dibuat sesuai `EMAIL_PROVIDER`) */
export function getEmailProvider(): EmailProvider {
  if (cached) return cached;

  switch (authConfig.email.provider) {
    case "smtp":
      cached = createSmtpProvider();
      return cached;
    default: {
      // divalidasi lagi di sini untuk jaga-jaga bila auth-config dipakai langsung
      throw new Error(
        `[email] EMAIL_PROVIDER="${authConfig.email.provider}" belum diimplementasikan.`,
      );
    }
  }
}
