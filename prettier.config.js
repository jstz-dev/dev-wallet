/**
 * @import { Config } from "prettier"
 * @import { PluginOptions } from "prettier-plugin-tailwindcss"
 */

/** @type {Config & PluginOptions}  */
export default {
  plugins: ["prettier-plugin-organize-imports", "prettier-plugin-tailwindcss"],

  trailingComma: "all",
  tabWidth: 2,
  printWidth: 100,
  semi: true,
  singleQuote: false,
  bracketSpacing: true,
};
