import { build } from "esbuild";

try {
  await build({
    entryPoints: ["index.ts", "market.ts"],
    bundle: true,
    format: "esm",
    target: "esnext",
    // outdir: "../../polimarket/src/app/api/market",
    outdir: "./dist",
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
