import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      //   '/api': {
      //     target: env.VITE_SERVER_URL,
      //     changeOrigin: true,
      //     secure: false,
      //     ws: true,
      //   },
    },
  },
});
