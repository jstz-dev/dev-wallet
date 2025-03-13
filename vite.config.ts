import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
