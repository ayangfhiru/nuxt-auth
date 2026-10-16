<script setup lang="ts">
/**
 * /reset-password — halaman mengganti password dengan kode OTP.
 *
 * Alur:
 *  1. Datang dari /forgot-password dengan ?email=...
 *  2. User memasukkan kode OTP + password baru (dua kali).
 *  3. useAuth().resetPassword() → Better Auth `emailOtp.resetPassword`.
 *  4. Server memvalidasi kode, mengganti password, MENCABUT sesi lama,
 *     lalu redirect ke /login dengan pesan sukses.
 */
import type AuthOtpForm from "~/components/auth/AuthOtpForm.vue";
import { normalizeEmail, passwordPolicy } from "~/utils/validation";

definePageMeta({ middleware: "guest" });

useHead({ title: "Reset your password — AuthOra" });

const route = useRoute();
const { resetPassword, sendOtp, loading, actionError } = useAuth();

const policy = passwordPolicy();
const otpForm = ref<InstanceType<typeof AuthOtpForm> | null>(null);

const email = computed(() =>
  typeof route.query["email"] === "string"
    ? normalizeEmail(route.query["email"])
    : "",
);

const password = ref("");
const confirmPassword = ref("");
const confirmError = ref("");

const notice = ref("");

const alert = computed(() =>
  actionError.value
    ? { type: "error" as const, message: actionError.value }
    : notice.value
      ? { type: "success" as const, message: notice.value }
      : { type: "success" as const, message: "" },
);

/** bila email tidak dibawa lewat query, tidak ada yang bisa di-reset */
watchEffect(() => {
  if (!email.value) {
    void navigateTo("/forgot-password");
  }
});

async function handleVerify(otp: string) {
  confirmError.value = "";
  notice.value = "";

  await resetPassword({
    email: email.value,
    otp,
    password: password.value,
    confirmPassword: confirmPassword.value,
  });
}

async function handleResend() {
  notice.value = "";

  const result = await sendOtp(email.value, "forget-password");

  if (result.ok) {
    notice.value = `If ${email.value} is registered, a new code is on its way.`;
    return;
  }

  // sinkronkan hitung mundur dengan keputusan server (cooldown/rate limit)
  if (result.retryAfter) {
    otpForm.value?.startCountdown(result.retryAfter);
  }
}
</script>

<template>
  <AuthShell>
    <AuthFormHeading
      title="Set a new password"
      description="Enter the code we sent to your e-mail, then choose a new password."
    />

    <AuthAlert
      v-if="alert.message"
      :type="alert.type"
      :message="alert.message"
      class="mb-5"
    />

    <AuthOtpForm
      v-if="email"
      ref="otpForm"
      :email="email"
      :loading="loading"
      submit-label="Reset password"
      @verify="handleVerify"
      @resend="handleResend"
    >
      <!-- field tambahan di dalam form yang sama -->
      <AuthPasswordField
        v-model="password"
        id="new-password"
        label="New password"
        placeholder="Enter your new password"
        autocomplete="new-password"
        :hint="`Use at least ${policy.minLength} characters.`"
        :required="true"
      />

      <AuthPasswordField
        v-model="confirmPassword"
        id="confirm-new-password"
        label="Confirm new password"
        placeholder="Re-enter your new password"
        autocomplete="new-password"
        :required="true"
        :error="confirmError"
      />
    </AuthOtpForm>
  </AuthShell>
</template>
