<script setup lang="ts">
/**
 * AuthTermsCheckbox — checkbox persetujuan ToS & Privacy Policy.
 * Nilainya diikat lewat v-model dari AuthForm.
 */
interface Props {
  error?: string;
}

withDefaults(defineProps<Props>(), {
  error: "",
});

const model = defineModel<boolean>({ default: false });
</script>

<template>
  <div>
    <label class="flex cursor-pointer items-start gap-2.5 pt-1">
      <input
        v-model="model"
        type="checkbox"
        class="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 accent-primary-600"
      />

      <span class="text-xs leading-5 text-neutral-500">
        I agree to the
        <a
          href="/terms"
          class="font-semibold text-neutral-900 underline underline-offset-2 transition hover:text-primary-600"
        >
          Terms of Service
        </a>
        and
        <a
          href="/privacy"
          class="font-semibold text-neutral-900 underline underline-offset-2 transition hover:text-primary-600"
        >
          Privacy Policy </a
        >.
      </span>
    </label>

    <p v-if="error" class="mt-1.5 pl-7 text-xs font-medium text-red-600">
      {{ error }}
    </p>
  </div>
</template>
