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
        "event-listener": "src/scripts/event-listener.ts",
        background: "src/scripts/background.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          switch (chunkInfo.name) {
            case "event-listener":
            case "background":
              return `scripts/${chunkInfo.name}.js`;
            default:
              return `assets/${chunkInfo.name}.js`;
          }
        },
      },
    },
  },
});
