<script setup lang="ts">
/**
 * /forgot-password — halaman meminta kode reset password.
 *
 * Alur:
 *  1. User memasukkan email akun.
 *  2. useAuth().requestPasswordReset() → endpoint /api/auth/otp/send
 *     (tipe "forget-password"), dengan cooldown & rate limit di server.
 *  3. Respons selalu sukses bila format email valid (tidak membocorkan
 *     keberadaan akun), lalu redirect ke /reset-password.
 */
import { normalizeEmail } from "~/utils/validation";

definePageMeta({ middleware: "guest" });

useHead({ title: "Forgot your password — AuthOra" });

const route = useRoute();
const { requestPasswordReset, loading, actionError } = useAuth();

const email = ref(
  typeof route.query["email"] === "string"
    ? normalizeEmail(route.query["email"])
    : "",
);
const emailError = ref("");

const alert = computed(() =>
  actionError.value
    ? { type: "error" as const, message: actionError.value }
    : { type: "success" as const, message: "" },
);

function handleSubmit() {
  if (loading.value) return; // cegah submit ganda

  emailError.value = "";
  void requestPasswordReset(email.value);
}
</script>

<template>
  <AuthShell>
    <AuthFormHeading
      title="Forgot your password?"
      description="Enter your e-mail address and we'll send you a code to reset it."
    />

    <AuthAlert
      v-if="alert.message"
      :type="alert.type"
      :message="alert.message"
      class="mb-5"
    />

    <form
      class="space-y-5 lg:space-y-4 lg:short:space-y-2.5"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <AuthTextField
        v-model="email"
        id="email"
        name="email"
        label="E-mail address"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        :required="true"
        :error="emailError"
      />

      <AuthSubmitButton :loading="loading" label="Send reset code" />
    </form>

    <p class="mt-6 text-center text-sm text-neutral-500">
      Remembered it?

      <NuxtLink
        to="/login"
        class="font-semibold text-primary-600 underline-offset-4 transition hover:underline"
      >
        Back to sign in
      </NuxtLink>
    </p>
  </AuthShell>
</template>
