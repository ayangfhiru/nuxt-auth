/**
 * lib/email/templates.ts — template email OTP (HTML + teks polos).
 *
 * Setiap email wajib menjelaskan (lihat docs/AUTH_FLOW.md):
 *   1. tujuan kode, 2. kode-nya, 3. lama berlaku, 4. peringatan jangan dibagikan.
 *
 * Template sengaja sederhana & inline-styled agar aman dibaca di semua client email.
 */

/** tipe OTP yang dikenal Better Auth plugin `email-otp` */
export type OtpEmailType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

interface OtpEmailContent {
  title: string;
  purpose: string;
}

const CONTENT: Record<OtpEmailType, OtpEmailContent> = {
  "email-verification": {
    title: "Verify your email address",
    purpose:
      "Use this code to verify your email address and activate your account.",
  },
  "sign-in": {
    title: "Your sign-in code",
    purpose: "Use this code to finish signing in to your account.",
  },
  "forget-password": {
    title: "Reset your password",
    purpose: "Use this code to reset the password of your account.",
  },
  "change-email": {
    title: "Confirm your new email address",
    purpose: "Use this code to confirm your new email address.",
  },
};

export interface OtpEmailInput {
  email: string;
  otp: string;
  type: OtpEmailType;
  /** lama berlaku kode dalam menit (dihitung dari detik) */
  expiresInMinutes: number;
  appName: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** render subjek, HTML, dan teks polos untuk satu kode OTP */
export function renderOtpEmail(input: OtpEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const content = CONTENT[input.type];
  const expires = `${input.expiresInMinutes} minute${input.expiresInMinutes === 1 ? "" : "s"}`;
  const appName = escapeHtml(input.appName);
  const otp = escapeHtml(input.otp);
  const email = escapeHtml(input.email);

  const subject = `${input.otp} is your ${input.appName} verification code`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f4f5;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:20px;border:1px solid #e5e5e5;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#5b3ef0;letter-spacing:0.02em;">${appName}</p>
                <h1 style="margin:16px 0 8px 0;font-size:22px;line-height:1.3;color:#171717;">${escapeHtml(content.title)}</h1>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#525252;">${escapeHtml(content.purpose)} This code was requested for <strong>${email}</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;">
                <p style="margin:0;padding:20px;text-align:center;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#171717;background:#f3f1ff;border-radius:14px;">${otp}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#737373;">This code expires in <strong>${expires}</strong>. It can only be used once.</p>
                <p style="margin:12px 0 0 0;font-size:13px;line-height:1.6;color:#b91c1c;">Never share this code. ${appName} will never ask for it.</p>
                <p style="margin:24px 0 0 0;font-size:12px;color:#a3a3a3;">If you did not request this email, you can safely ignore it.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${input.appName} — ${content.title}

${content.purpose}

Your verification code: ${input.otp}

The code expires in ${expires} and can only be used once.
Never share this code. ${input.appName} will never ask for it.

If you did not request this email, you can safely ignore it.
`;

  return { subject, html, text };
}
