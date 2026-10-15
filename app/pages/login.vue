<script setup lang="ts">
/**
 * /login — halaman masuk.
 *
 * Alur:
 *  1. User isi email & password.
 *  2. useAuth().login() → Better Auth `signIn.email`.
 *  3. Email belum terverifikasi → otomatis diarahkan ke /verify-email.
 *  4. Sukses → halaman tujuan (`?redirect=`) atau /dashboard.
 *
 * Pesan sukses dari halaman lain dibaca lewat query:
 *  ?verified=1 (setelah verifikasi), ?reset=1 (setelah reset password),
 *  ?signedout=1 (setelah logout).
 */
definePageMeta({ middleware: "guest" });

useHead({ title: "Sign in — AuthOra" });

const route = useRoute();
const { login, continueWithGoogle, loading, actionError } = useAuth();

/** pesan sukses dari halaman sebelumnya */
const notice = computed(() => {
  if (route.query["verified"]) {
    return "Your e-mail has been verified. Please sign in to continue.";
  }
  if (route.query["reset"]) {
    return "Your password has been reset. Please sign in with your new password.";
  }
  if (route.query["signedout"]) {
    return "You have been signed out. See you soon!";
  }
  return "";
});

/** alert: error selalu di atas pesan sukses */
const alert = computed(() =>
  actionError.value
    ? { type: "error" as const, message: actionError.value }
    : notice.value
      ? { type: "success" as const, message: notice.value }
      : { type: "success" as const, message: "" },
);

function handleSubmit(values: { email: string; password: string }) {
  void login({
    email: values.email,
    password: values.password,
    redirect: route.query["redirect"],
  });
}
</script>

<template>
  <AuthShell>
    <AuthFormHeading
      title="Welcome back"
      description="Sign in to continue to your account."
    />

    <AuthAlert
      v-if="alert.message"
      :type="alert.type"
      :message="alert.message"
      class="mb-5"
    />

    <AuthForm mode="login" :loading="loading" @submit="handleSubmit" />

    <AuthDivider label="OR CONTINUE WITH" class="my-6 lg:my-5 lg:short:my-2" />

    <AuthGoogleButton @click="continueWithGoogle()" />

    <AuthSwitchMode
      class="mt-8 lg:mt-6 lg:short:mt-3"
      prompt="Don't have an account?"
      action="Create account"
      @switch="navigateTo('/register')"
    />
  </AuthShell>
</template>
