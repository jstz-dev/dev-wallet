import { build } from "bun";

try {
  const output = await build({
    entrypoints: ["index.ts", "market.ts"],
    minify: true,
    packages: "bundle",
    format: "esm",
    // outdir: "../../polimarket/src/app/api/market",
    outdir: "./dist",
    splitting: false,
    sourcemap: "none",
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
