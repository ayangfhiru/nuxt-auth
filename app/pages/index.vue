<script setup lang="ts">
/**
 * HALAMAN AUTH (register / login)
 * ---------------------------------------------------------------------------
 * Halaman ini hanya berfungsi sebagai "perakit" (composer) — UI-nya disusun
 * dari komponen-komponen kecil di folder `app/components/auth/`.
 *
 * Alur component (baca dari atas ke bawah, sama persis dengan urutan visual):
 *
 *  <AuthPanel>            panel kiri (card putih)
 *   ├─ <AppLogo>          logo AuthOra
 *   ├─ <AuthFormHeading>  judul + subjudul (menyesuaikan mode)
 *   ├─ <AuthAlert>        pesan error / sukses
 *   ├─ <AuthForm>         seluruh isi form  ──emit──▶ handleSubmit()
 *   │    ├─ <AuthTextField>      input teks biasa (name, email)
 *   │    ├─ <AuthPasswordField>  input password + toggle lihat password
 *   │    ├─ <AuthTermsCheckbox>  checkbox persetujuan
 *   │    └─ <AuthSubmitButton>   tombol submit
 *   ├─ <AuthDivider>      garis "OR CONTINUE WITH"
 *   ├─ <AuthGoogleButton> login Google ──emit──▶ handleGoogleLogin()
 *   └─ <AuthSwitchMode>   "Already have an account? Sign in"
 *
 *  <AuthShowcasePanel>    panel kanan (promo gelap)
 *   ├─ <AuthShowcaseBadge>
 *   ├─ <AuthShowcaseFeature> ×4 (fitur: OTP, Prisma, Better Auth, Tech stack)
 *   └─ <AuthShowcaseNote>
 *
 * Tugas halaman ini hanya: menyimpan state (mode, loading, pesan) dan
 * memanggil Better Auth client. Logika form ada di <AuthForm>.
 */
import { authClient } from "~/lib/auth-client";
import type { AuthFormValues, AuthMode } from "~/lib/auth-types";

const mode = ref<AuthMode>("register");
const loading = ref(false);

/** pesan yang tampil di <AuthAlert> */
const alert = reactive({
  type: "error" as "error" | "success",
  message: "",
});

/** judul & subjudul mengikuti mode */
const heading = computed(() =>
  mode.value === "register"
    ? {
        title: "Create your account",
        description: "Get started with your account. It only takes a minute.",
      }
    : {
        title: "Welcome back",
        description: "Sign in to continue to your account.",
      },
);

/** teks untuk tombol pindah mode */
const switchModeText = computed(() =>
  mode.value === "register"
    ? { prompt: "Already have an account?", action: "Sign in" }
    : { prompt: "Don't have an account?", action: "Create account" },
);

/** Ganti antara register <-> login (state & pesan ikut direset). */
function handleSwitchMode() {
  mode.value = mode.value === "register" ? "login" : "register";
  alert.message = "";
}

/** Submit form: arahkan ke endpoint yang sesuai dengan mode. */
async function handleSubmit(values: AuthFormValues) {
  loading.value = true;
  alert.message = "";

  try {
    const { error } =
      mode.value === "register"
        ? await authClient.signUp.email({
            name: values.name,
            email: values.email,
            password: values.password,
          })
        : await authClient.signIn.email({
            email: values.email,
            password: values.password,
            rememberMe: true,
          });

    if (error) {
      alert.type = "error";
      alert.message = error.message || "Something went wrong. Please try again.";
      return;
    }

    alert.type = "success";

    if (mode.value === "register") {
      // akun berhasil dibuat → langsung pindahkan user ke form login
      alert.message = "Your account has been created. You can sign in now.";
      mode.value = "login";
    } else {
      alert.message = "Welcome back! You are signed in.";
    }
  } catch (error) {
    alert.type = "error";
    alert.message =
      error instanceof Error ? error.message : "Something went wrong.";
  } finally {
    loading.value = false;
  }
}

/** Login dengan Google (dipanggil dari <AuthGoogleButton>). */
async function handleGoogleLogin() {
  alert.message = "";

  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
  });
}

const currentYear = new Date().getFullYear();
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center bg-[#f4f4f5] px-4 py-8 text-neutral-900 sm:px-8 lg:py-6 lg:short:py-3"
  >
    <!-- Card utama: 2 kolom (form | promo) -->
    <section
      class="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-[28px] border border-neutral-200/70 bg-white shadow-[0_24px_80px_rgba(15,15,35,0.08)] lg:grid-cols-2"
    >
      <!-- ===================== Kolom kiri: FORM ===================== -->
      <AuthPanel>
        <AppLogo class="mb-12 lg:mb-8 lg:short:mb-4" />

        <AuthFormHeading
          :title="heading.title"
          :description="heading.description"
        />

        <AuthAlert
          v-if="alert.message"
          :type="alert.type"
          :message="alert.message"
          class="mb-5"
        />

        <AuthForm
          :mode="mode"
          :loading="loading"
          @submit="handleSubmit"
        />

        <AuthDivider
          label="OR CONTINUE WITH"
          class="my-6 lg:my-5 lg:short:my-4"
        />

        <AuthGoogleButton @click="handleGoogleLogin" />

        <AuthSwitchMode
          class="mt-8 lg:mt-6 lg:short:mt-4"
          :prompt="switchModeText.prompt"
          :action="switchModeText.action"
          @switch="handleSwitchMode"
        />

        <p
          class="mt-8 text-center text-xs text-neutral-400 lg:mt-6 lg:short:mt-4"
        >
          © {{ currentYear }} AuthOra. All rights reserved.
        </p>
      </AuthPanel>

      <!-- ===================== Kolom kanan: PROMO ===================== -->
      <AuthShowcasePanel />
    </section>
  </main>
</template>
