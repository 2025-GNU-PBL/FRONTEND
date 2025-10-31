// src/lib/api/axios.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getRefreshToken, setTokens } from "../auth/tokenStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
if (!API_BASE) {
  console.error(
    "VITE_API_BASE_URL is not defined. Check your .env and restart dev server."
  );
}

// 로그인/토큰 관련 엔드포인트들 (상단에서 먼저 선언)
const AUTH_PATHS = [
  "/api/v1/auth/login",
  "/auth/login",
  "/auth/kakao",
  "/auth/naver",
  "/auth/refresh",
];


const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (isAuthPath(config.url)) return config;

  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let waiters: Array<(t: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const { response, config } = error;
    const original = config as any;

    const normReject = (e: AxiosError<any>) => {
      let message = e.message;
      const data = (e.response?.data ?? {}) as any;
      if ((data as any)?.message) message = (data as any).message;
      return Promise.reject(new Error(message));
    };

    // 로그인/리프레시 요청 자체의 실패는 그대로 내보냄 (리프레시 재시도 금지)
    if (isAuthPath(original?.url)) {
      return normReject(error);
    }

    // 액세스 토큰 만료 처리
    if (
      response?.status === 401 &&
      (response.data as any)?.code === "AUTH4001" &&
      !original?._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          waiters.push((newAT) => {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${newAT}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      original._retry = true;

      try {
        const rt = getRefreshToken();
        if (!rt) throw new Error("No refresh token found.");

        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          { refreshToken: rt },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAT = data?.data?.accessToken;
        const newRT = data?.data?.refreshToken;
        if (!newAT) throw new Error("No access token from refresh response.");

        setTokens(newAT, newRT);

        waiters.forEach((fn) => fn(newAT));
        waiters = [];

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAT}`;
        return api(original);
      } catch (e) {
        clearTokens();
        return normReject(e as AxiosError<any>);
      } finally {
        isRefreshing = false;
      }
    }

    return normReject(error);
  }
);

export default api;
