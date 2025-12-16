import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { 
    ignores: [
      "dist/**",
      "build/**",
      ".vite/**",
      "node_modules/**",
      "docs/**/*.{ts,tsx,js,jsx}",
      "*.config.js",
      "vite.config.ts.timestamp-*"
    ] 
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off", // Desabilitado: permite exports de constantes/tipos junto com componentes
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
