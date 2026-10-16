<script setup lang="ts">
/**
 * AuthTextField — field generik: label + input + pesan hint/error.
 *
 * Kalau butuh tombol di dalam input (contoh: mata password), masukkan lewat
 * slot `trailing`, lalu tombolnya di-position absolute di kanan.
 */
type InputType = "text" | "email" | "password";
type InputMode =
  | "text"
  | "numeric"
  | "decimal"
  | "search"
  | "email"
  | "tel"
  | "url";

interface Props {
  id: string;
  label: string;
  type?: InputType;
  name?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  autocomplete?: string;
  required?: boolean;
  minlength?: number;
  maxlength?: number;
  /** kontrol keyboard di mobile, mis. "numeric" untuk kode OTP */
  inputmode?: InputMode;
}

withDefaults(defineProps<Props>(), {
  type: "text",
  name: "",
  placeholder: "",
  hint: "",
  error: "",
  autocomplete: "off",
  required: false,
  minlength: undefined,
  maxlength: undefined,
  inputmode: undefined,
});

const model = defineModel<string>({ default: "" });
</script>

<template>
  <div>
    <label
      :for="id"
      class="mb-2 block text-sm font-semibold text-neutral-900 lg:short:mb-1.5"
    >
      {{ label }}
    </label>

    <div class="relative">
      <input
        :id="id"
        v-model="model"
        :type="type"
        :name="name || id"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :minlength="minlength"
        :maxlength="maxlength"
        :inputmode="inputmode"
        :aria-invalid="Boolean(error)"
        class="w-full rounded-xl border bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 lg:short:py-2.5"
        :class="
          error
            ? 'border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/12'
            : 'border-neutral-300 hover:border-neutral-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/12'
        "
      />

      <!-- Slot untuk kontrol di dalam input (mis. toggle lihat password) -->
      <slot name="trailing" />
    </div>

    <p v-if="error" class="mt-2 text-xs font-medium text-red-600">
      {{ error }}
    </p>

    <p v-else-if="hint" class="mt-2 text-xs text-neutral-400">
      {{ hint }}
    </p>
  </div>
</template>
