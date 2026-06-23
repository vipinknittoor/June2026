import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: ["public/sw.js", "public/workbox-*.js"],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
