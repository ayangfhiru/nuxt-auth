<script setup lang="ts">
/**
 * AuthShowcaseTechStack — deretan chip teknologi (Nuxt, Tailwind, dst.)
 * yang dipakai project ini.
 */
const stack = [
  { name: "Nuxt.js", brand: "#00DC82" },
  { name: "Tailwind CSS", brand: "#38BDF8" },
  { name: "Prisma", brand: "#D6D6E0" },
  { name: "PostgreSQL", brand: "#4169E1" },
];
</script>

<template>
  <div class="mt-2.5 flex flex-wrap gap-2">
    <span
      v-for="item in stack"
      :key="item.name"
      class="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/6 px-2.5 py-1.5 text-xs font-medium text-neutral-200"
    >
      <!-- logo Nuxt (pegunungan) -->
      <svg
        v-if="item.name === 'Nuxt.js'"
        viewBox="0 0 24 24"
        class="h-3.5 w-3.5"
      >
        <path d="M12 4.5 20.5 20h-17L12 4.5Z" :fill="item.brand" />
        <path d="M12 9.5 16.5 20h-9L12 9.5Z" fill="#0b0917" />
      </svg>

      <!-- logo Tailwind (ombak) -->
      <svg
        v-else-if="item.name === 'Tailwind CSS'"
        viewBox="0 0 24 24"
        class="h-3.5 w-3.5"
        fill="none"
        :stroke="item.brand"
        stroke-width="2.4"
        stroke-linecap="round"
      >
        <path
          d="M3.5 12.5c1.6-4 4-5.4 6.4-2.8 1.5 1.6 2.5 2.4 4.2 2.4 2 0 3.2-1.3 4-3.1-.7 4.3-3.9 7.3-7.3 5.9-1.6-.7-2.6-1.6-4.3-1.6-1.8 0-3.1 1-4.2 2.6"
        />
      </svg>

      <!-- logo Prisma (prisma segitiga) -->
      <svg
        v-else-if="item.name === 'Prisma'"
        viewBox="0 0 24 24"
        class="h-3.5 w-3.5"
      >
        <path
          d="M12 3.5 20.5 21h-5.2L12 12.4 8.7 21H3.5L12 3.5Z"
          :fill="item.brand"
        />
      </svg>

      <!-- logo PostgreSQL (lingkaran P) -->
      <svg v-else viewBox="0 0 24 24" class="h-3.5 w-3.5">
        <circle cx="12" cy="12" r="9" :fill="item.brand" />
        <text
          x="12"
          y="15.6"
          text-anchor="middle"
          font-size="10"
          font-weight="700"
          fill="#ffffff"
        >
          P
        </text>
      </svg>

      {{ item.name }}
    </span>
  </div>
</template>
