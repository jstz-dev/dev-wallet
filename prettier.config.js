/**
 * @import { Config } from "prettier"
 * @import { PluginConfig } from "@trivago/prettier-plugin-sort-imports"
 * @import { PluginOptions } from "prettier-plugin-tailwindcss"
 */

/** @type {Config & PluginOptions & PluginConfig}  */
export default {
  plugins: ["@trivago/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],

  trailingComma: "all",
  tabWidth: 2,
  printWidth: 100,
  semi: true,
  singleQuote: false,
  bracketSpacing: true,

  importOrder: ["^@[a-z]+", "<THIRD_PARTY_MODULES>", "^[@/]", "^[./]"],
  importOrderSeparation: true,
};
