<script setup lang="ts">
/**
 * AuthShowcasePanel — panel gelap di kolom kanan (promo AuthOra).
 *
 * Alur di dalam template (atas ke bawah):
 *   dekorasi latar -> brand -> badge -> judul -> daftar fitur -> catatan
 *
 * Catatan ukuran:
 * - Panel ini dulunya penyebab halaman "nge-scroll" di laptop, jadi ukurannya
 *   sudah dirapatkan (padding, judul, jarak antar fitur).
 * - Ada tambahan variant `short:` (lihat app/assets/main.css) yang memadatkan
 *   lagi tampilan hanya saat tinggi layar <= 900px. Komponen ini memang hanya
 *   tampil di `lg`, jadi smartphone tidak terpengaruh.
 */
</script>

<template>
  <div class="hidden p-5 short:p-4 lg:block">
    <div
      class="relative flex h-full min-h-140 flex-col overflow-hidden rounded-3xl bg-[#0b0917] p-8 short:p-5 text-white"
    >
      <!-- ===== Dekorasi latar ===== -->
      <div
        class="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl"
      ></div>

      <svg
        class="pointer-events-none absolute -right-20 -top-16 h-80 w-80 text-white/10"
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        stroke-width="0.75"
      >
        <ellipse
          cx="100"
          cy="100"
          rx="96"
          ry="52"
          transform="rotate(-32 100 100)"
        />
        <ellipse
          cx="100"
          cy="100"
          rx="74"
          ry="98"
          transform="rotate(-32 100 100)"
        />
      </svg>

      <!-- ===== Brand ===== -->
      <AppLogo variant="dark" class="relative z-10" />

      <!-- ===== Konten utama ===== -->
      <div class="relative z-10 my-auto py-4 short:py-2">
        <AuthShowcaseBadge />

        <h2
          class="mt-3 short:mt-2 max-w-lg text-3xl font-bold leading-[1.12] tracking-tight xl:text-4xl xl:short:text-3xl"
        >
          Authentication,<br />
          made <span class="text-primary-400">simple</span>.
        </h2>

        <p class="mt-4 short:mt-3 max-w-md text-sm leading-6 text-neutral-400">
          Register, login, and verify with ease. Secure by design, built for
          developers.
        </p>

        <!-- Daftar fitur -->
        <div class="mt-5 short:mt-4">
          <AuthShowcaseFeature icon="lock" title="Email OTP Verification">
            Secure one-time password (OTP) sent to your email for verification
            and sign-in.
          </AuthShowcaseFeature>

          <AuthShowcaseFeature icon="database" title="PostgreSQL with Prisma">
            Reliable PostgreSQL database with Prisma ORM for type-safe queries
            and migrations.
          </AuthShowcaseFeature>

          <AuthShowcaseFeature icon="shield" title="Better Auth">
            Modern authentication library with
            <span class="font-medium text-primary-400">
              built-in support for email OTP
            </span>
            , sessions, and more.
          </AuthShowcaseFeature>

          <AuthShowcaseFeature icon="code" title="Built with Modern Stack">
            <template #extra>
              <AuthShowcaseTechStack />
            </template>
          </AuthShowcaseFeature>
        </div>
      </div>

      <!-- ===== Catatan bawah ===== -->
      <AuthShowcaseNote class="relative z-10">
        Email OTP can be sent using
        <a
          href="https://www.better-auth.com"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold text-primary-400 underline underline-offset-2"
        >
          Better Auth
        </a>
        out of the box.<br class="hidden xl:block" />
        <a
          href="https://nodemailer.com"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold text-primary-400 underline underline-offset-2"
        >
          Nodemailer
        </a>
        is optional for advanced email customizations.
      </AuthShowcaseNote>
    </div>
  </div>
</template>
