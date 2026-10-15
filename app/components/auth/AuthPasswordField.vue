<script setup lang="ts">
/**
 * AuthPasswordField — field password = AuthTextField + tombol lihat/sembunyikan.
 * Komponen ini tidak menulis ulang input, hanya "menyusun" AuthTextField.
 */
interface Props {
  id?: string;
  label?: string;
  name?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  autocomplete?: string;
  required?: boolean;
}

withDefaults(defineProps<Props>(), {
  id: "password",
  label: "Password",
  name: "",
  placeholder: "Enter your password",
  hint: "",
  error: "",
  autocomplete: "current-password",
  required: false,
});

const model = defineModel<string>({ default: "" });
const visible = ref(false);
</script>

<template>
  <AuthTextField
    v-model="model"
    :id="id"
    :label="label"
    :name="name"
    :type="visible ? 'text' : 'password'"
    :placeholder="placeholder"
    :hint="hint"
    :error="error"
    :autocomplete="autocomplete"
    :required="required"
    :minlength="8"
  >
    <template #trailing>
      <button
        type="button"
        class="absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400 transition hover:text-primary-600"
        :aria-label="visible ? 'Sembunyikan password' : 'Tampilkan password'"
        @click="visible = !visible"
      >
        <!-- mata terbuka -->
        <svg
          v-if="!visible"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          class="h-5 w-5"
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>

        <!-- mata tercoret -->
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          class="h-5 w-5"
        >
          <path
            d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.4 0 10 7 10 7a16 16 0 0 1-3.2 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.4 0 2.7-.4 3.8-.9"
            stroke-linecap="round"
          />
          <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        </svg>
      </button>
    </template>
  </AuthTextField>
</template>
