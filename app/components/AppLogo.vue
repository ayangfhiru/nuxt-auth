<script setup lang="ts">
/**
 * AppLogo — logo brand AuthOra (perisai + lubang kunci).
 * Dipakai di 2 tempat: panel kiri (terang) dan panel kanan (gelap).
 */
interface Props {
  /** "light" untuk area terang, "dark" untuk panel gelap */
  variant?: "light" | "dark";
  /** ukuran logo: sm = toolbar/header, lg = hero */
  size?: "sm" | "lg";
}

withDefaults(defineProps<Props>(), {
  variant: "light",
  size: "sm",
});
</script>

<template>
  <a href="/" class="flex w-fit items-center gap-2.5" aria-label="AuthOra — Home">
    <!-- Ikon perisai (keyhole dibuat "bolong" pakai fill-rule evenodd
         supaya warnanya ikut menyesuaikan background) -->
    <span
      v-if="variant === 'light'"
      class="text-primary-600"
    >
      <svg viewBox="0 0 24 24" class="h-9 w-9" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M12 2.4 4.5 5.1v6c0 4.5 3.05 8.55 7.5 10.05 4.45-1.5 7.5-5.55 7.5-10.05v-6L12 2.4Zm0 6.2a1.9 1.9 0 0 0-.95 3.56L10.6 15.6h2.8l-.45-3.44A1.9 1.9 0 0 0 12 8.6Z"
        />
      </svg>
    </span>

    <span
      v-else
      class="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-b from-primary-500 to-primary-700 text-white shadow-[0_8px_20px_rgba(91,62,240,0.45)]"
    >
      <svg viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="M12 2.4 4.5 5.1v6c0 4.5 3.05 8.55 7.5 10.05 4.45-1.5 7.5-5.55 7.5-10.05v-6L12 2.4Zm0 6.2a1.9 1.9 0 0 0-.95 3.56L10.6 15.6h2.8l-.45-3.44A1.9 1.9 0 0 0 12 8.6Z"
        />
      </svg>
    </span>

    <span
      class="font-bold tracking-tight"
      :class="size === 'lg' ? 'text-2xl' : 'text-xl'"
    ><span :class="variant === 'dark' ? 'text-white' : 'text-neutral-900'">Auth</span><span class="text-primary-500">Ora</span></span>
  </a>
</template>
