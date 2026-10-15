/**
 * lib/env.ts — validasi environment variable di sisi server.
 *
 * Dipanggil tepat satu kali saat modul di-import, sehingga:
 *  - `server/utils/auth.ts`     → gagal jelas saat Better Auth dibuat
 *  - `server/plugins/*.ts`      → gagal jelas saat server boot
 *
 * Kebijakan:
 *  - Variabel esensial yang kosong  → LEMPAR ERROR (daftar lengkap, bukan satu-satu).
 *  - Provider email tak dikenal     → LEMPAR ERROR.
 *  - Variabel opsional              → biarkan, nilainya sudah ada default di
 *                                      `lib/auth-config.ts`.
 *
 * Catatan: modul ini server-only; jangan di-import dari `app/`.
 */
import { authConfig } from "./auth-config";

/** daftar variabel yang wajib terisi agar sistem auth bisa berjalan */
function missingEssentialVariables(): string[] {
  const missing: string[] = [];

  if (!authConfig.secret) missing.push("BETTER_AUTH_SECRET");
  if (!authConfig.baseURL) missing.push("BETTER_AUTH_URL");
  if (!process.env["DATABASE_URL"]) missing.push("DATABASE_URL");
  if (!process.env["EMAIL_PROVIDER"] && !authConfig.email.smtp.host) {
    // provider default adalah smtp → host wajib diisi
    missing.push("EMAIL_PROVIDER (atau set SMTP_HOST)");
  }
  if (authConfig.email.provider === "smtp" && !authConfig.email.smtp.host) {
    missing.push("SMTP_HOST");
  }

  return missing;
}

/** lempar error yang mudah dibaca developer baru */
export function validateAuthEnv(): void {
  const missing = missingEssentialVariables();
  if (missing.length > 0) {
    throw new Error(
      `[auth] Konfigurasi environment belum lengkap.\n` +
        `       Tambahkan ke file .env (lihat .env.example): ${missing.join(", ")}\n` +
        `       Lalu restart server.`,
    );
  }

  if (authConfig.email.provider !== "smtp") {
    throw new Error(
      `[auth] EMAIL_PROVIDER="${authConfig.email.provider}" tidak didukung. ` +
        `Saat ini hanya "smtp" (Nodemailer) yang diimplementasikan — ` +
        `lihat bagian Email Provider di docs/AUTH_FLOW.md.`,
    );
  }
}

// dievaluasi saat pertama kali di-import → fail-fast
validateAuthEnv();
