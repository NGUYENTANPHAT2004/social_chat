import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Kế thừa cấu hình Next.js
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Ghi đè hoặc thêm rule tại đây
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json", // nếu bạn dùng project mode
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // ✅ Tắt rule tại đây
    },
  },
];

export default eslintConfig;
