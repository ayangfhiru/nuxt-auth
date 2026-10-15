<script setup lang="ts">
/**
 * /dashboard — halaman contoh yang DILINDUNGI.
 *
 * Proteksi:
 *  1. `middleware: "auth"` → redirect ke /login bila tidak ada sesi
 *     (dan ke /verify-email bila email belum terverifikasi).
 *  2. Data user diambil dari sesi server (get-session), bukan dari storage.
 *  3. Endpoint server yang sensitif tetap wajib memvalidasi sesi sendiri —
 *     contohnya GET /api/me (lihat server/utils/require-auth.ts).
 */
definePageMeta({ middleware: "auth" });

useHead({ title: "Dashboard — AuthOra" });

const { user, logout, loading } = useAuth();

const memberSince = computed(() => {
  const value = (user.value as { createdAt?: string | Date } | null)?.createdAt;
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});
</script>

<template>
  <main
    class="min-h-screen bg-[#f4f4f5] px-4 py-10 text-neutral-900 sm:px-8 sm:py-14"
  >
    <section
      class="mx-auto w-full max-w-3xl rounded-[28px] border border-neutral-200/70 bg-white p-8 shadow-[0_24px_80px_rgba(15,15,35,0.08)] sm:p-10"
    >
      <AppLogo class="mb-10" />

      <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
        Welcome back, {{ user?.name ?? "there" }}!
      </h1>

      <p class="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
        You are signed in to your AuthOra account. This page is only reachable
        with a valid server session.
      </p>

      <dl
        class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            E-mail
          </dt>
          <dd class="mt-1 text-sm font-medium text-neutral-900">
            {{ user?.email ?? "—" }}
          </dd>
        </div>

        <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Status
          </dt>
          <dd class="mt-1 text-sm font-medium text-neutral-900">
            <span
              class="mr-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" class="h-3 w-3">
                <path d="m5 12.5 4.2 4.2L19 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              E-mail verified
            </span>
          </dd>
        </div>

        <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Member since
          </dt>
          <dd class="mt-1 text-sm font-medium text-neutral-900">
            {{ memberSince }}
          </dd>
        </div>

        <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Session
          </dt>
          <dd class="mt-1 text-sm font-medium text-neutral-900">
            Active on this device
          </dd>
        </div>
      </dl>

      <div class="mt-10 flex flex-wrap items-center gap-4">
        <button
          type="button"
          :disabled="loading"
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          @click="logout()"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
            <path d="M15 17l5-5-5-5M20 12H9m6.5-7H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Sign out
        </button>

        <NuxtLink
          to="/forgot-password"
          class="text-sm font-semibold text-primary-600 underline-offset-4 transition hover:underline"
        >
          Change password
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
