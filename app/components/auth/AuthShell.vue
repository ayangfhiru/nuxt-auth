<script setup lang="ts">
/**
 * AuthShell — layout dua kolom untuk SEMUA halaman auth
 * (/register, /login, /verify-email, /forgot-password, /reset-password).
 *
 *  <AuthShell>            main → section (grid 2 kolom)
 *   ├─ <AuthPanel>        kolom kiri (card putih)
 *   │   ├─ <AppLogo>      logo (selalu tampil)
 *   │   ├─ <slot />       isi halaman: heading → alert → form → link bawah
 *   │   └─ footer copyright
 *   └─ <AuthShowcasePanel> kolom kanan promo (hanya layar lebar)
 *
 * Halaman cukup mengisi <slot />; layout, logo, dan copyright tidak diulang.
 */
withDefaults(defineProps<{ showcase?: boolean }>(), { showcase: true });

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
        <AppLogo class="mb-12 lg:mb-8 lg:short:mb-2" />

        <slot />

        <p
          class="mt-8 text-center text-xs text-neutral-400 lg:mt-6 lg:short:mt-2"
        >
          © {{ currentYear }} AuthOra. All rights reserved.
        </p>
      </AuthPanel>

      <!-- ===================== Kolom kanan: PROMO ===================== -->
      <AuthShowcasePanel v-if="showcase" />
    </section>
  </main>
</template>
