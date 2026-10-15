/**
 * Tipe data yang dipakai oleh flow form auth.
 * Ditaruh di sini supaya bisa di-import oleh page maupun komponen
 * tanpa harus import langsung dari file `.vue`.
 */

/** mode halaman auth */
export type AuthMode = "register" | "login";

/** nilai yang dikirim ketika form di-submit */
export interface AuthFormValues {
  name: string;
  email: string;
  password: string;
}
