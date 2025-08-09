import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 1600, // increase limit to 1.6 MB
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"], // core React libs
          ui: ["lucide-react"], // UI-related libs
          rtc: ["socket.io-client"], // WebRTC / sockets
        },
      },
    },
  },
});
