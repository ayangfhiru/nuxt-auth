<script setup lang="ts">
/**
 * AuthDivider — garis pemisah berteks, mis. "OR CONTINUE WITH".
 */
interface Props {
  label?: string;
}

withDefaults(defineProps<Props>(), {
  label: "OR CONTINUE WITH",
});
</script>

<template>
  <div class="flex items-center gap-4" role="separator">
    <div class="h-px flex-1 bg-neutral-200"></div>

    <span class="text-xs font-medium tracking-[0.08em] text-neutral-400">
      {{ label }}
    </span>

    <div class="h-px flex-1 bg-neutral-200"></div>
  </div>
</template>
