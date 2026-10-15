<script setup lang="ts">
/**
 * AuthSwitchMode — teks bawah form untuk berpindah register <-> login.
 * Contoh: "Already have an account? [Sign in]"
 */
interface Props {
  prompt: string;
  action: string;
}

defineProps<Props>();

defineEmits<{
  switch: [];
}>();
</script>

<template>
  <p class="text-center text-sm text-neutral-500">
    {{ prompt }}

    <button
      type="button"
      class="font-semibold text-primary-600 underline-offset-4 transition hover:underline"
      @click="$emit('switch')"
    >
      {{ action }}
    </button>
  </p>
</template>
