<script setup lang="ts">
/**
 * AuthShowcaseFeature — satu baris fitur di panel promo
 * (kotak ikon + judul + deskripsi).
 *
 * `icon` menentukan ikon mana yang tampil, isi deskripsi ada di slot default,
 * dan konten tambahan (mis. daftar tech stack) ada di slot `extra`.
 */
interface Props {
  title: string;
  icon: "lock" | "database" | "shield" | "code";
}

defineProps<Props>();
</script>

<template>
  <article
    class="flex gap-4 border-b border-white/10 py-2.5 short:py-1.5 last:border-b-0"
  >
    <!-- Kotak ikon -->
    <span
      class="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-primary-400"
    >
      <!-- Email OTP -->
      <svg
        v-if="icon === 'lock'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        class="h-6 w-6"
      >
        <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
        <path d="M8 10.5V7.8a4 4 0 1 1 8 0v2.7" stroke-linecap="round" />
        <circle cx="12" cy="15.2" r="1.3" fill="currentColor" stroke="none" />
      </svg>

      <!-- Database -->
      <svg
        v-else-if="icon === 'database'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        class="h-6 w-6"
      >
        <ellipse cx="12" cy="6.2" rx="7.2" ry="3" />
        <path d="M4.8 6.2v11.6c0 1.66 3.22 3 7.2 3s7.2-1.34 7.2-3V6.2" />
        <path d="M4.8 12c0 1.66 3.22 3 7.2 3s7.2-1.34 7.2-3" />
      </svg>

      <!-- Shield / Better Auth -->
      <svg
        v-else-if="icon === 'shield'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        class="h-6 w-6"
      >
        <path
          d="M12 3 5 5.6v5.2c0 4 2.8 7.6 7 8.8 4.2-1.2 7-4.8 7-8.8V5.6L12 3Z"
          stroke-linejoin="round"
        />
        <path
          d="m9.2 11.8 2.2 2.2 4-4.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <!-- Code -->
      <svg
        v-else
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        class="h-6 w-6"
      >
        <path
          d="m9 7-5 5 5 5M15 7l5 5-5 5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>

    <div class="min-w-0">
      <h3 class="text-base font-semibold text-white">{{ title }}</h3>

      <div class="mt-1 text-sm leading-5 text-neutral-400">
        <slot />
      </div>

      <slot name="extra" />
    </div>
  </article>
</template>
