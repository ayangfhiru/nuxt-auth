<script setup lang="ts">
/**
 * AuthGoogleButton — tombol "Continue with Google".
 * Komponen ini murni UI; aksi login-nya ditangani halaman lewat event `click`.
 */
defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50"
    @click="$emit('click')"
  >
    <svg viewBox="0 0 48 48" class="h-5 w-5">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.9z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.7-3.6-11.3-8.4H5.9v5.1C9.2 39.5 16 44 24 44z"
      />
      <path
        fill="#FBBC05"
        d="M12.7 27.7a12 12 0 0 1 0-7.4v-5.1H5.9a20 20 0 0 0 0 17.6z"
      />
      <path
        fill="#EA4335"
        d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.9 29.5 4 24 4 16 4 9.2 8.5 5.9 15.2l6.8 5.1c1.6-4.8 6-8.4 11.3-8.4z"
      />
    </svg>

    Continue with Google
  </button>
</template>
