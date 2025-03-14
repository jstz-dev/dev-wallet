import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    nodePolyfills({ include: ["stream", "events"] }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        "service-worker": "src/scripts/service-worker.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          switch (chunkInfo.name) {
            case "service-worker":
              return `scripts/${chunkInfo.name}.js`;
            default:
              return `assets/${chunkInfo.name}.js`;
          }
        },
      },
    },
  },
});
