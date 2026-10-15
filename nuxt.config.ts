import tailwindcss from "@tailwindcss/vite";
import { publicAuthConfig } from "./lib/auth-config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: publicAuthConfig.appName,
    },
  },

  runtimeConfig: {
    /*
     * Nilai PUBLIK (aman untuk browser): nama app, URL, kebijakan password & OTP.
     * Diambil dari lib/auth-config.ts sehingga .env.example selalu sinkron dengan
     * kode. Bisa juga dioverride lewat env NUXT_PUBLIC_*.
     *
     * RAHASIA (BETTER_AUTH_SECRET, SMTP_PASSWORD, DATABASE_URL, ...) tidak pernah
     * masuk runtimeConfig — server membacanya lewat lib/env.ts yang tervalidasi.
     */
    public: { ...publicAuthConfig },
  },

  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
});
