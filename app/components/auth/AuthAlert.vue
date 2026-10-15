<script setup lang="ts">
/**
 * AuthAlert — pesan singkat di atas form (error dari server / info sukses).
 * Tampil hanya jika prop `message` tidak kosong.
 */
interface Props {
  message?: string;
  type?: "error" | "success";
}

withDefaults(defineProps<Props>(), {
  message: "",
  type: "error",
});
</script>

<template>
  <div
    v-if="message"
    role="alert"
    class="flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-6"
    :class="
      type === 'error'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-primary-200 bg-primary-50 text-primary-700'
    "
  >
    <!-- ikon error -->
    <svg
      v-if="type === 'error'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      class="mt-0.5 h-4 w-4 shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.2v.3" stroke-linecap="round" />
    </svg>

    <!-- ikon sukses -->
    <svg
      v-else
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      class="mt-0.5 h-4 w-4 shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path
        d="m8.2 12.2 2.6 2.6 5-5.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <span>{{ message }}</span>
  </div>
</template>
