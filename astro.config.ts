import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"

export default defineConfig({
  site: "https://auzum197.com",
  server: { host: "127.0.0.1" },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
})
