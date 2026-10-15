<script setup lang="ts">
/**
 * AuthForm — "otak" dari form login/register.
 *
 * Tugasnya:
 *  1. menyusun field-field (AuthTextField / AuthPasswordField / AuthTermsCheckbox)
 *  2. memvalidasi input sebelum dikirim (helper di app/utils/validation.ts)
 *  3. mem-broadcast hasilnya ke halaman lewat event `submit`
 *
 * Halaman (pages/register.vue & pages/login.vue) yang memutuskan mau memanggil
 * API apa, jadi komponen ini tidak tahu-menahu soal backend.
 */
import type { AuthFormValues, AuthMode } from "~/lib/auth-types";
import {
  isValidEmail,
  normalizeEmail,
  passwordConfirmationError,
  passwordError,
  passwordPolicy,
} from "~/utils/validation";

interface Props {
  mode: AuthMode;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  submit: [values: AuthFormValues];
}>();

const isRegister = computed(() => props.mode === "register");
const policy = passwordPolicy();

/** nilai semua input */
const form = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});

/** status checkbox persetujuan (khusus register) */
const agreed = ref(false);

/** pesan validasi per field (kosong = tidak ada error) */
const errors = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreed: "",
});

function clearErrors() {
  errors.name = "";
  errors.email = "";
  errors.password = "";
  errors.confirmPassword = "";
  errors.agreed = "";
}

function validate(): boolean {
  clearErrors();

  // 1. nama (khusus register)
  if (isRegister.value && form.name.trim().length < 2) {
    errors.name = "Please enter your full name.";
  }

  // 2. email
  const email = normalizeEmail(form.email);
  if (!email) {
    errors.email = "Please enter your e-mail address.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid e-mail address.";
  }

  // 3. password (register ikut kebijakan panjang; login cukup terisi)
  const passwordMessage = isRegister.value
    ? passwordError(form.password)
    : form.password
      ? null
      : "Please enter your password.";

  if (passwordMessage) errors.password = passwordMessage;

  // 4. konfirmasi password (khusus register)
  if (isRegister.value) {
    const confirmMessage = passwordConfirmationError(
      form.password,
      form.confirmPassword,
    );
    if (confirmMessage) errors.confirmPassword = confirmMessage;
  }

  // 5. persetujuan ToS (khusus register)
  if (isRegister.value && !agreed.value) {
    errors.agreed = "You must agree to the Terms of Service and Privacy Policy.";
  }

  return !Object.values(errors).some(Boolean);
}

function handleSubmit() {
  if (props.loading) return; // cegah submit ganda
  if (!validate()) return;

  emit("submit", {
    name: form.name.trim(),
    email: normalizeEmail(form.email),
    password: form.password,
    confirmPassword: form.confirmPassword,
  });
}

/** Setiap ganti mode, bersihkan password + error supaya form terasa "baru". */
watch(
  () => props.mode,
  () => {
    form.password = "";
    form.confirmPassword = "";
    agreed.value = false;
    clearErrors();
  },
);
</script>

<template>
  <form
    class="space-y-5 lg:space-y-4 lg:short:space-y-2"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <!-- 1. Full name (hanya register) -->
    <AuthTextField
      v-if="isRegister"
      v-model="form.name"
      id="name"
      name="name"
      label="Full name"
      type="text"
      autocomplete="name"
      placeholder="John Doe"
      :required="true"
      :error="errors.name"
    />

    <!-- 2. E-mail -->
    <AuthTextField
      v-model="form.email"
      id="email"
      name="email"
      label="E-mail address"
      type="email"
      autocomplete="email"
      placeholder="you@example.com"
      :required="true"
      :error="errors.email"
    />

    <!-- 3. Password (+ toggle lihat password) -->
    <AuthPasswordField
      v-model="form.password"
      :autocomplete="isRegister ? 'new-password' : 'current-password'"
      :hint="
        isRegister
          ? `Use at least ${policy.minLength} characters for your password.`
          : ''
      "
      :required="true"
      :error="errors.password"
    />

    <!-- 3b. Lupa password? (hanya login) -->
    <div v-if="!isRegister" class="-mt-2 flex justify-end lg:-mt-1">
      <NuxtLink
        to="/forgot-password"
        class="text-xs font-semibold text-primary-600 underline-offset-4 transition hover:underline"
      >
        Forgot password?
      </NuxtLink>
    </div>

    <!-- 4. Konfirmasi password (hanya register) -->
    <AuthPasswordField
      v-if="isRegister"
      v-model="form.confirmPassword"
      id="confirm-password"
      label="Confirm password"
      placeholder="Re-enter your password"
      autocomplete="new-password"
      :required="true"
      :error="errors.confirmPassword"
    />

    <!-- 5. Persetujuan ToS (hanya register) -->
    <AuthTermsCheckbox
      v-if="isRegister"
      v-model="agreed"
      :error="errors.agreed"
    />

    <!-- 6. Tombol submit -->
    <AuthSubmitButton
      :loading="loading"
      :label="isRegister ? 'Create account' : 'Sign in'"
    />
  </form>
</template>
