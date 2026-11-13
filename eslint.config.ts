import js from "@eslint/js"
import globals from "globals"
import astro from "eslint-plugin-astro"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist", ".astro"]),
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    ignores: ["**/*.astro/*.js"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message: "JavaScript is banned. Use TypeScript.",
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  astro.configs.recommended,
  astro.configs["jsx-a11y-recommended"],
])
