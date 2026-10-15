<script setup lang="ts">
/**
 * AuthFormHeading — judul + subjudul form.
 * Isinya berubah mengikuti mode (register / login).
 */
interface Props {
  title: string;
  description: string;
}

defineProps<Props>();
</script>

<template>
  <header class="mb-8 lg:mb-6 lg:short:mb-2">
    <h1 class="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
      {{ title }}
    </h1>

    <p class="mt-3 max-w-sm text-sm leading-6 text-neutral-500 lg:short:mt-2">
      {{ description }}
    </p>
  </header>
</template>
