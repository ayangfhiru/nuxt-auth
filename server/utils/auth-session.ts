import type { H3Event } from "h3";
import { auth } from "./auth";

/**
 * server/utils/auth-session.ts — akses sesi di sisi server.
 *
 * SEMUA keputusan otorisasi di server memakai helper ini (bukan state Vue),
 * karena sesi klien tidak pernah dipercaya sebagai authorization.
 */

/** ambil sesi aktif dari cookie request; `null` bila tidak ada / kedaluwarsa */
export async function getSession(event: H3Event) {
  try {
    return await auth.api.getSession({ headers: event.headers });
  } catch {
    // cookie rusak / sesi kedaluwarsa → perlakukan sebagai tamu
    return null;
  }
}

/** tipe sesi yang dihasilkan Better Auth */
export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
