<script setup lang="ts">
/**
 * AuthSubmitButton — tombol utama (submit) dengan state loading.
 * Selalu `type="submit"`, jadi otomatis mengikuti <form> induk.
 */
interface Props {
  label: string;
  loading?: boolean;
  loadingLabel?: string;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  loadingLabel: "Please wait...",
});
</script>

<template>
  <button
    type="submit"
    :disabled="loading"
    class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-b from-primary-500 to-primary-700 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(91,62,240,0.28)] transition duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
  >
    <!-- spinner saat loading -->
    <svg
      v-if="loading"
      viewBox="0 0 24 24"
      fill="none"
      class="h-4 w-4 animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        stroke-opacity="0.3"
        stroke-width="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>

    <span>{{ loading ? loadingLabel : label }}</span>

    <!-- panah kanan -->
    <svg
      v-if="!loading"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      class="h-4 w-4"
    >
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>
