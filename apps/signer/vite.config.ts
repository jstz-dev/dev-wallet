import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    nodePolyfills({ include: ["stream", "events", "buffer", "util"] }),
    wasm(),
    topLevelAwait(),
  ],
  build: {
    minify: false,
    rollupOptions: {
      input: {
        main: "index.html",
        "service-worker": "src/scripts/service-worker.ts",
        "content-script": "src/scripts/content-script.ts",
        "jstz-signer-script": "src/scripts/jstz-signer-script.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          switch (chunkInfo.name) {
            case "service-worker":
            case "content-script":
            case "jstz-signer-script":
              return `scripts/${chunkInfo.name}.js`;
            default:
              return `assets/${chunkInfo.name}.js`;
          }
        },
      },
    },
  },
  worker: {
    // Not needed with vite-plugin-top-level-await >= 1.3.0
    // format: "es",
    plugins: () => [wasm(), topLevelAwait()],
  },
});
