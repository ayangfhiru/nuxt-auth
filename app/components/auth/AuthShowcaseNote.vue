<script setup lang="ts">
/**
 * AuthShowcaseNote — kotak catatan kecil di bawah panel promo
 * (teks bebas, dimasukkan lewat slot default).
 */
</script>

<template>
  <aside class="rounded-2xl border border-white/10 bg-white/4 p-3 short:p-2">
    <div class="flex items-start gap-3">
      <span
        class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-500/15 text-primary-400"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          class="h-4 w-4"
        >
          <path d="M9.5 18h5M10 21h4" stroke-linecap="round" />
          <path
            d="M12 3a6.5 6.5 0 0 0-4 11.6c.6.5 1 1.2 1 2h6c0-.8.4-1.5 1-2A6.5 6.5 0 0 0 12 3Z"
            stroke-linejoin="round"
          />
        </svg>
      </span>

      <p class="text-xs leading-5 text-neutral-300">
        <slot />
      </p>
    </div>
  </aside>
</template>
