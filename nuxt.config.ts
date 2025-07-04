// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: false },

  ssr: false,

  modules: [
    "@nuxt/ui",
    "@pinia/nuxt",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxtjs/color-mode",
  ],

  css: ["~/assets/css/main.css"],

  // Настройки для color-mode
  colorMode: {
    preference: "system", // default, 'system', 'light', or 'dark'
    fallback: "light", // fallback value if no system preference found
    classSuffix: "", // class name suffix for ColorScheme
  },

  runtimeConfig: {
    public: {
      apiBaseUrl:
        process.env.ENV__DEV_MODE === "true"
          ? process.env.ENV__API_BASE_URL
          : "/api",
      workHoursPerMonth: Number(process.env.ENV__WORK_HOURS_PER_MONTH) || 160,
    },
  },
});
