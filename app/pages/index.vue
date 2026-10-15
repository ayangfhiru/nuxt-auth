<script setup lang="ts">
/**
 * / — hanya pintu arah.
 *
 * Halaman auth yang sesungguhnya ada di /register, /login, dll.
 * Dari sini: sudah login → /dashboard, selain itu → /login.
 */
const headers = useRequestHeaders(["cookie"]);

const current = await $fetch<{ user?: unknown } | null>(
  "/api/auth/get-session",
  { headers },
).catch(() => null);

await navigateTo(current?.user ? "/dashboard" : "/login", {
  redirectCode: 302,
  replace: true,
});
</script>

<template>
  <div />
</template>
