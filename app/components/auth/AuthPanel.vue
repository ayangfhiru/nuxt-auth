<script setup lang="ts">
/**
 * AuthPanel — container kolom kiri (card putih berisi form).
 * Tidak punya logika sama sekali, semua isi dimasukkan lewat slot.
 */
</script>

<template>
  <div
    class="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-10 lg:short:py-3"
  >
    <slot />
  </div>
</template>
