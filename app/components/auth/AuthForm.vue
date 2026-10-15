<script setup lang="ts">
/**
 * AuthForm — "otak" dari form login/register.
 *
 * Tugasnya:
 *  1. menyusun field-field (AuthTextField / AuthPasswordField / AuthTermsCheckbox)
 *  2. memvalidasi input sebelum dikirim
 *  3. mem-broadcast hasilnya ke halaman lewat event `submit`
 *
 * Halaman (pages/index.vue) yang memutuskan mau memanggil API apa,
 * jadi komponen ini tidak tahu-menahu soal backend.
 */
import type { AuthFormValues, AuthMode } from "~/lib/auth-types";

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

/** nilai semua input */
const form = reactive<AuthFormValues>({
  name: "",
  email: "",
  password: "",
});

/** status checkbox persetujuan (khusus register) */
const agreed = ref(false);

/** pesan validasi per field (kosong = tidak ada error) */
const errors = reactive({
  name: "",
  email: "",
  password: "",
  agreed: "",
});

function clearErrors() {
  errors.name = "";
  errors.email = "";
  errors.password = "";
  errors.agreed = "";
}

function validate(): boolean {
  clearErrors();

  if (isRegister.value && form.name.trim().length < 2) {
    errors.name = "Please enter your full name.";
  }

  if (!form.email.trim()) {
    errors.email = "Please enter your e-mail address.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Please enter a valid e-mail address.";
  }

  if (!form.password) {
    errors.password = "Please enter your password.";
  } else if (isRegister.value && form.password.length < 8) {
    errors.password = "Use at least 8 characters for your password.";
  }

  if (isRegister.value && !agreed.value) {
    errors.agreed = "You must agree to the Terms of Service and Privacy Policy.";
  }

  return !Object.values(errors).some(Boolean);
}

function handleSubmit() {
  if (!validate()) return;

  emit("submit", {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password,
  });
}

/** Setiap ganti mode, bersihkan password + error supaya form terasa "baru". */
watch(
  () => props.mode,
  () => {
    form.password = "";
    agreed.value = false;
    clearErrors();
  },
);
</script>

<template>
  <form
    class="space-y-5 lg:space-y-4 lg:short:space-y-2.5"
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
        isRegister ? 'Use at least 8 characters for your password.' : ''
      "
      :required="true"
      :error="errors.password"
    />

    <!-- 4. Persetujuan ToS (hanya register) -->
    <AuthTermsCheckbox
      v-if="isRegister"
      v-model="agreed"
      :error="errors.agreed"
    />

    <!-- 5. Tombol submit -->
    <AuthSubmitButton
      :loading="loading"
      :label="isRegister ? 'Create account' : 'Sign in'"
    />
  </form>
</template>
