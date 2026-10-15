<script setup lang="ts">
/**
 * /verify-email — halaman memasukkan kode OTP verifikasi email.
 *
 * Alur:
 *  1. Datang dari /register (kode sudah dikirim) → tombol kirim ulang berhitung
 *     mundur selama cooldown.
 *  2. Datang dari /login dengan email belum terverifikasi (?reason=unverified)
 *     → tombol kirim ulang aktif, kode dikirim saat ditekan.
 *  3. verify-email dengan kode benar → email ditandai terverifikasi, redirect
 *     ke /login dengan pesan sukses.
 *
 * Cooldown dikirim ulang DIPAKSA OLEH SERVER (/api/auth/otp/send),
 * bukan sekadar hitung mundur di browser.
 */
import { normalizeEmail, otpSettings } from "~/utils/validation";

definePageMeta({ middleware: "guest" });

useHead({ title: "Verify your e-mail — AuthOra" });

const route = useRoute();
const { verifyEmail, resendVerificationOtp, loading, actionError } = useAuth();

const settings = otpSettings();
const otpForm = ref<InstanceType<typeof AuthOtpForm> | null>(null);

const email = computed(() =>
  typeof route.query["email"] === "string"
    ? normalizeEmail(route.query["email"])
    : "",
);

/** kode baru saja dikirim oleh /register → mulai dengan cooldown penuh */
const initialCooldown = computed(() =>
  route.query["reason"] === "unverified" ? 0 : settings.resendCooldownSeconds,
);

/** pesan sukses (mis. setelah kirim ulang) */
const notice = ref("");

const alert = computed(() =>
  actionError.value
    ? { type: "error" as const, message: actionError.value }
    : notice.value
      ? { type: "success" as const, message: notice.value }
      : { type: "success" as const, message: "" },
);

/** bila email tidak dibawa lewat query, tidak ada yang bisa diverifikasi */
watchEffect(() => {
  if (!email.value) {
    void navigateTo("/register");
  }
});

async function handleVerify(otp: string) {
  notice.value = "";
  await verifyEmail({ email: email.value, otp });
}

async function handleResend() {
  notice.value = "";

  const result = await resendVerificationOtp(email.value);

  if (result.ok) {
    notice.value = `If ${email.value} is registered, a new code is on its way.`;
    return;
  }

  // server menolak (cooldown/rate limit) → sinkronkan hitung mundur dengan server
  if (result.retryAfter) {
    otpForm.value?.startCountdown(result.retryAfter);
  }
}
</script>

<template>
  <AuthShell>
    <AuthFormHeading
      title="Verify your e-mail"
      description="We sent you a one-time code. Enter it below to activate your account."
    />

    <AuthAlert
      v-if="route.query['reason'] === 'unverified'"
      type="error"
      message="Your e-mail address is not verified yet. Send a code to continue."
      class="mb-5"
    />

    <AuthAlert
      v-else-if="alert.message"
      :type="alert.type"
      :message="alert.message"
      class="mb-5"
    />

    <AuthOtpForm
      v-if="email"
      ref="otpForm"
      :email="email"
      :loading="loading"
      :initial-cooldown="initialCooldown"
      submit-label="Verify code"
      @verify="handleVerify"
      @resend="handleResend"
    />

    <p class="mt-6 text-center text-sm text-neutral-500">
      Wrong address?

      <NuxtLink
        to="/register"
        class="font-semibold text-primary-600 underline-offset-4 transition hover:underline"
      >
        Create a new account
      </NuxtLink>
    </p>
  </AuthShell>
</template>
