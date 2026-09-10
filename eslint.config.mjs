import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({baseDirectory: import.meta.dirname});
const config = [{ignores:[".next*/**", "node_modules/**"]}, ...compat.extends("next/core-web-vitals"), {rules:{"@next/next/no-html-link-for-pages":"warn","@next/next/no-img-element":"off"}}];

export default config;
