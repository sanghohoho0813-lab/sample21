import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: [".next/**", "node_modules/**", "qa-output/**", "qa/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 데모 이미지 슬롯은 <img>로 둔다 (사진 자산 추후 적용 · next/image 최적화 불필요)
      "@next/next/no-img-element": "off",
    },
  },
];
