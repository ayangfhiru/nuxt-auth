/**
 * app/composables/useAuth.ts — satu-satunya pintu aksi auth untuk Vue.
 *
 * Berisi: register, login, logout, kirim/kirim ulang OTP, verifikasi email,
 * lupa & reset password, plus akses session.
 *
 * Prinsip:
 *  - Semua request authentication lewat Better Auth client (kecuali
 *    kirim/ resend OTP yang lewat endpoint sendiri karena butuh cooldown server).
 *  - Logika UI (state loading, pesan, redirect) ada DI SINI, bukan di template.
 *  - Validasi client hanya UX; server tetap memvalidasi ulang.
 */
import { authClient } from "~/lib/auth-client";
import {
  genericAuthError,
  mapAuthError,
  mapFetchError,
  retryAfterFromError,
} from "~/utils/auth-error";
import {
  isValidEmail,
  normalizeEmail,
  normalizeOtp,
  isValidOtpFormat,
  otpSettings,
  passwordConfirmationError,
  passwordError,
  safeInternalRedirect,
} from "~/utils/validation";

/** tipe OTP yang didukung (email verifikasi & reset password saja) */
export type OtpSendType = "email-verification" | "forget-password";

export interface AuthActionResult {
  ok: boolean;
  /** pesan aman untuk ditampilkan user */
  error?: string;
  /** detik cooldown setelah berhasil kirim (dari server) */
  cooldown?: number;
  /** detik yang harus ditunggu bila ditolak cooldown/rate limit */
  retryAfter?: number;
  /** true bila login ditolak karena email belum terverifikasi */
  needsVerification?: boolean;
}

export function useAuth() {
  /* ----------------------------- sesi ----------------------------- */
  const sessionStore = authClient.useSession();

  const session = computed(() => sessionStore.value.data ?? null);
  const user = computed(() => session.value?.user ?? null);
  const isAuthenticated = computed(() => Boolean(session.value?.user));
  const sessionPending = computed(() => sessionStore.value.isPending);

  /** minta ulang data sesi (mis. setelah verifikasi email) */
  function refreshSession() {
    return sessionStore.value.refetch();
  }

  /* ------------------------ state umum UI ------------------------- */
  const loading = ref(false);
  const actionError = ref("");

  function fail(message: string): AuthActionResult {
    actionError.value = message;
    return { ok: false, error: message };
  }

  /** bungkus aksi: cegah double-submit + kelola state loading */
  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    if (loading.value) return null; // sedang ada request berjalan
    loading.value = true;
    actionError.value = "";
    try {
      return await action();
    } catch (error) {
      return fail(mapFetchError(error)) as T;
    } finally {
      loading.value = false;
    }
  }

  /* --------------------------- register --------------------------- */
  async function register(input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<AuthActionResult> {
    const name = input.name.trim();
    const email = normalizeEmail(input.email);

    if (name.length < 2) return fail("Please enter your full name.");
    if (!isValidEmail(email)) return fail("Please enter a valid e-mail address.");

    const passwordMessage = passwordError(input.password);
    if (passwordMessage) return fail(passwordMessage);

    const confirmMessage = passwordConfirmationError(
      input.password,
      input.confirmPassword,
    );
    if (confirmMessage) return fail(confirmMessage);

    return (
      (await run(async () => {
        const { error } = await authClient.signUp.email({
          name,
          email,
          password: input.password,
        });

        if (error) return fail(mapAuthError(error));

        // Better Auth mengirim OTP verifikasi sebagai bagian dari sign-up,
        // lalu user diarahkan ke halaman verifikasi (belum ada sesi).
        await navigateTo({ path: "/verify-email", query: { email } });
        return { ok: true };
      })) ?? { ok: false, error: genericAuthError() }
    );
  }

  /* ---------------------------- login ----------------------------- */
  async function login(input: {
    email: string;
    password: string;
    redirect?: unknown;
  }): Promise<AuthActionResult> {
    const email = normalizeEmail(input.email);

    if (!isValidEmail(email)) return fail("Please enter a valid e-mail address.");
    if (!input.password) return fail("Please enter your password.");

    return (
      (await run(async () => {
        const { error } = await authClient.signIn.email({
          email,
          password: input.password,
          rememberMe: true,
        });

        if (error) {
          const code = (error as { code?: string }).code;

          // kebijakan: email belum terverifikasi → arahkan ke halaman OTP
          if (code === "EMAIL_NOT_VERIFIED") {
            const message = "Please verify your e-mail address before signing in.";
            actionError.value = message;
            await navigateTo({ path: "/verify-email", query: { email } });
            return { ok: false, error: message, needsVerification: true };
          }

          return fail(mapAuthError(error));
        }

        await navigateTo(safeInternalRedirect(input.redirect, "/dashboard"));
        return { ok: true };
      })) ?? { ok: false, error: genericAuthError() }
    );
  }

  /* ---------------------------- logout ---------------------------- */
  async function logout(): Promise<void> {
    await run(async () => {
      // cukup panggil API resmi Better Auth; cookie sesi diurus server
      await authClient.signOut();
      await navigateTo({ path: "/login", query: { signedout: "1" } });
      return { ok: true };
    });
  }

  /* -------------- kirim / kirim ulang OTP (endpoint sendiri) ------ */
  async function sendOtp(
    email: string,
    type: OtpSendType,
  ): Promise<AuthActionResult> {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      return fail("Please enter a valid e-mail address.");
    }

    return (
      (await run(async () => {
        const response = await $fetch<{ success: boolean; cooldown: number }>(
          "/api/auth/otp/send",
          { method: "POST", body: { email: normalized, type } },
        );

        return {
          ok: true,
          cooldown: response.cooldown ?? otpSettings().resendCooldownSeconds,
        };
      })) ?? { ok: false, error: genericAuthError() }
    );
  }

  /** alias jelas untuk halaman verifikasi: kirim ulang kode verifikasi */
  function resendVerificationOtp(email: string): Promise<AuthActionResult> {
    return sendOtp(email, "email-verification");
  }

  /* ------------------------ verifikasi email ---------------------- */
  async function verifyEmail(input: {
    email: string;
    otp: string;
  }): Promise<AuthActionResult> {
    const email = normalizeEmail(input.email);
    const otp = normalizeOtp(input.otp);

    if (!isValidEmail(email)) return fail("Please enter a valid e-mail address.");
    if (!isValidOtpFormat(otp)) {
      return fail(`Enter the ${otpSettings().length}-digit code from your e-mail.`);
    }

    return (
      (await run(async () => {
        const { error } = await authClient.emailOtp.verifyEmail({ email, otp });

        if (error) return fail(mapAuthError(error));

        await refreshSession();
        // kebijakan sesi: setelah verifikasi, user login manual
        await navigateTo({ path: "/login", query: { verified: "1" } });
        return { ok: true };
      })) ?? { ok: false, error: genericAuthError() }
    );
  }

  /* ----------------------- lupa / reset password ------------------ */
  async function requestPasswordReset(
    email: string,
  ): Promise<AuthActionResult> {
    const result = await sendOtp(email, "forget-password");
    if (!result.ok) return result;

    await navigateTo({
      path: "/reset-password",
      query: { email: normalizeEmail(email) },
    });
    return result;
  }

  async function resetPassword(input: {
    email: string;
    otp: string;
    password: string;
    confirmPassword: string;
  }): Promise<AuthActionResult> {
    const email = normalizeEmail(input.email);
    const otp = normalizeOtp(input.otp);

    if (!isValidEmail(email)) return fail("Please enter a valid e-mail address.");
    if (!isValidOtpFormat(otp)) {
      return fail(`Enter the ${otpSettings().length}-digit code from your e-mail.`);
    }

    const passwordMessage = passwordError(input.password);
    if (passwordMessage) return fail(passwordMessage);

    const confirmMessage = passwordConfirmationError(
      input.password,
      input.confirmPassword,
    );
    if (confirmMessage) return fail(confirmMessage);

    return (
      (await run(async () => {
        const { error } = await authClient.emailOtp.resetPassword({
          email,
          otp,
          password: input.password,
        });

        if (error) return fail(mapAuthError(error));

        // kebijakan: sesi lama dicabut server saat reset password
        await refreshSession();
        await navigateTo({ path: "/login", query: { reset: "1" } });
        return { ok: true };
      })) ?? { ok: false, error: genericAuthError() }
    );
  }

  /* --------------------------- social ----------------------------- */
  async function continueWithGoogle(callbackURL = "/dashboard"): Promise<void> {
    actionError.value = "";
    // Better Auth yang mengurus redirect OAuth-nya
    await authClient.signIn.social({ provider: "google", callbackURL });
  }

  return {
    // sesi
    session,
    user,
    isAuthenticated,
    sessionPending,
    refreshSession,
    // state UI
    loading,
    actionError,
    // aksi
    register,
    login,
    logout,
    sendOtp,
    resendVerificationOtp,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    continueWithGoogle,
  };
}
