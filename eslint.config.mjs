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
        "warn",
        {
          fixToUnknown: true,
          ignoreRestArgs: false
        }
      ],
      // 👇 Desactiva el error por variables no usadas (como useState, etc.)
      "@typescript-eslint/no-unused-vars": [
        "warn", // o "off" si no quieres ni advertencias
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true
        }
      ]
    }
  },
  {
    files: ["**/*.d.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  }
];

export default eslintConfig;
