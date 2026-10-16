<script setup lang="ts">
/**
 * OtpForm — form kode OTP: input kode + field tambahan (slot) + tombol submit
 * + tombol "kirim ulang" berhitung mundur.
 *
 * Dipakai di dua halaman:
 *  - /verify-email     (slot kosong, submit = verifikasi kode)
 *  - /reset-password   (slot berisi field password baru)
 *
 * Logika request ada di halaman (via `useAuth`); komponen ini hanya UI:
 *  - menampilkan error validasi kode di dekat input
 *  - men-disable tombol kirim ulang selama cooldown (tampilan saja;
 *    COOLDOWN SEBENARNYA dipaksa oleh server — lihat /api/auth/otp/send)
 *
 * Cara pakai dari halaman:
 *   <OtpForm ref="otpForm" @verify="..." @resend="..." />
 *   otpForm.value?.startCountdown(detik)   // sinkronkan dari respons server
 */
import {
  isValidOtpFormat,
  normalizeOtp,
  otpSettings,
} from "~/utils/validation";

interface Props {
  /** email tujuan kode (ditampilkan sebagai hint) */
  email: string;
  loading?: boolean;
  /** teks tombol submit, mis. "Verify code" / "Reset password" */
  submitLabel?: string;
  loadingLabel?: string;
  /** detik cooldown awal (0 = tombol kirim ulang langsung aktif) */
  initialCooldown?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  submitLabel: "Verify code",
  loadingLabel: "Please wait...",
  initialCooldown: undefined,
});

const emit = defineEmits<{
  /** user menekan tombol submit dengan kode yang sudah diisi */
  verify: [otp: string];
  /** user menekan tombol kirim ulang */
  resend: [];
}>();

const settings = otpSettings();
const code = ref("");

/** error validasi untuk input kode */
const codeError = ref("");

function validate(): boolean {
  if (!isValidOtpFormat(normalizeOtp(code.value), settings.length)) {
    codeError.value = `Enter the ${settings.length}-digit code from your e-mail.`;
    return false;
  }

  codeError.value = "";
  return true;
}

function handleSubmit() {
  if (props.loading) return; // cegah submit ganda
  if (!validate()) return;

  emit("verify", normalizeOtp(code.value));
}

/* ------------------------- countdown resend ------------------------- */
const countdown = ref(props.initialCooldown ?? settings.resendCooldownSeconds);
let timer: ReturnType<typeof setInterval> | null = null;

const canResend = computed(() => countdown.value <= 0);

function tick() {
  if (countdown.value <= 0) {
    stopTimer();
    return;
  }
  countdown.value -= 1;
}

function startTimer() {
  if (timer) return;
  if (countdown.value <= 0) return;
  timer = setInterval(tick, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

/** dipanggil halaman setelah dapat respons server (sukses atau 429) */
function startCountdown(seconds: number) {
  countdown.value = Math.max(0, Math.floor(seconds));
  stopTimer();
  startTimer();
}

function handleResend() {
  if (!canResend.value || props.loading) return;

  // mulai hitung mundur lokal; halaman akan menyinkronkan dengan respons server
  startCountdown(settings.resendCooldownSeconds);
  emit("resend");
}

onMounted(startTimer);
onBeforeUnmount(stopTimer);

defineExpose({ startCountdown });
</script>

<template>
  <form
    class="space-y-5 lg:space-y-4 lg:short:space-y-2"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <!-- 1. Kode OTP -->
    <AuthTextField
      v-model="code"
      id="otp"
      name="otp"
      label="Verification code"
      type="text"
      inputmode="numeric"
      :maxlength="settings.length"
      autocomplete="one-time-code"
      :placeholder="'0'.repeat(settings.length)"
      :required="true"
      :error="codeError"
      :hint="`Enter the ${settings.length}-digit code we sent to ${email}.`"
    />

    <!-- 2. Field tambahan dari halaman (mis. password baru) -->
    <slot />

    <!-- 3. Tombol submit -->
    <AuthSubmitButton
      :loading="loading"
      :loading-label="loadingLabel"
      :label="submitLabel"
    />

    <!-- 4. Kirim ulang + hitung mundur -->
    <p class="text-center text-sm text-neutral-500">
      Didn't get the code?

      <button
        type="button"
        :disabled="!canResend || loading"
        class="font-semibold text-primary-600 underline-offset-4 transition hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
        @click="handleResend"
      >
        {{ canResend ? "Resend code" : `Resend in ${countdown}s` }}
      </button>
    </p>
  </form>
</template>
