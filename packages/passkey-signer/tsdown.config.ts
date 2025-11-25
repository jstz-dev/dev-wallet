import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.js"],
  outDir: "./dist",
  dts: true,
  format: "esm",
  clean: true,
  target: false,
  platform: "node",
  exports: true,
});
