// src/lib/env.ts

export const ENV = {
  MODE: import.meta.env.VITE_APP_ENV,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  KAKAO_CLIENT_ID: import.meta.env.VITE_KAKAO_CLIENT_ID,
  KAKAO_REDIRECT_URI: import.meta.env.VITE_KAKAO_REDIRECT_URI,
  NAVER_CLIENT_ID: import.meta.env.VITE_NAVER_CLIENT_ID,
  NAVER_REDIRECT_URI: import.meta.env.VITE_NAVER_REDIRECT_URI,
};
