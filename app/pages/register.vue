<script setup lang="ts">
/**
 * /register — halaman pembuatan akun.
 *
 * Alur:
 *  1. User isi nama, email, password, konfirmasi password (validasi di AuthForm).
 *  2. useAuth().register() → Better Auth `signUp.email`.
 *  3. Server membuat akun + MENGIRIM kode OTP verifikasi (email-verification).
 *  4. Redirect ke /verify-email?email=...
 *
 * Catatan anti-enumeration: bila email sudah terdaftar, Better Auth tetap
 * membalas sukses generik, jadi pengunjung tidak bisa menebak keberadaan akun.
 */
import type { AuthFormValues } from "~/lib/auth-types";

definePageMeta({ middleware: "guest" });

useHead({ title: "Create your account — AuthOra" });

const { register, continueWithGoogle, loading, actionError } = useAuth();

function handleSubmit(values: AuthFormValues) {
  void register({
    name: values.name,
    email: values.email,
    password: values.password,
    confirmPassword: values.confirmPassword ?? "",
  });
}
</script>

<template>
  <AuthShell>
    <AuthFormHeading
      title="Create your account"
      description="Get started with your account. It only takes a minute."
    />

    <AuthAlert
      v-if="actionError"
      type="error"
      :message="actionError"
      class="mb-5"
    />

    <AuthForm mode="register" :loading="loading" @submit="handleSubmit" />

    <AuthDivider label="OR CONTINUE WITH" class="my-6 lg:my-5 lg:short:my-2" />

    <AuthGoogleButton @click="continueWithGoogle()" />

    <AuthSwitchMode
      class="mt-8 lg:mt-6 lg:short:mt-3"
      prompt="Already have an account?"
      action="Sign in"
      @switch="navigateTo('/login')"
    />
  </AuthShell>
</template>
