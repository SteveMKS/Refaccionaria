import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": [
        "warn", // Puedes cambiar a "error" si prefieres que falle el lint
        {
          "fixToUnknown": true, // Sugiere usar 'unknown' en lugar de 'any'
          "ignoreRestArgs": false // Controla si se permiten 'any' en parámetros rest
        }
      ]
    }
  },
  {
    // Opcional: Configuración para permitir 'any' en archivos específicos
    files: ["**/*.d.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];

export default eslintConfig;