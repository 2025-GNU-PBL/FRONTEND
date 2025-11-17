// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // .env / .env.production 값을 로드
  const env = loadEnv(mode, process.cwd(), "");
  const isProd = mode === "production";

  // 개발 중 CORS·혼합콘텐츠 회피용 프록시 (배포에서는 사용 안 함)
  const apiBase = env.VITE_API_BASE_URL || "";
  const useProxy = !isProd && /^https?:\/\//.test(apiBase);

  return {
    plugins: [react(), tailwindcss()],
    base: "/", // SPA 루트 (Netlify 등에서 / 경로 배포)
    server: {
      port: 3000,
      strictPort: true,
      proxy: useProxy
        ? {
            "/api": {
              target: apiBase,
              changeOrigin: true,
              secure: false,
              // 백엔드가 /api 프리픽스가 없다면 아래 주석을 해제하세요.
              // rewrite: (path) => path.replace(/^\/api/, ""),
            },
          }
        : undefined,
    },
    preview: {
      port: 3000,
    },
  };
});
