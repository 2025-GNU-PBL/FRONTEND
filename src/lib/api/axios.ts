// src/lib/api/axios.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getRefreshToken, setTokens } from "../auth/tokenStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
if (!API_BASE) {
  console.error(
    "VITE_API_BASE_URL is not defined. Check your .env and restart dev server."
  );
}

const AUTH_PATHS = [
  "/api/v1/auth/login",
  "/auth/login",
  "/auth/kakao",
  "/auth/naver",
  "/auth/refresh",
];

const isAuthPath = (url?: string | null) => {
  if (!url) return false;
  return AUTH_PATHS.some((p) => url.includes(p));
};

const api = axios.create({
  baseURL: API_BASE,
  // ❌ 전역 Content-Type 지정하지 않습니다.
  withCredentials: true, // 쿠키/세션 필요 없으면 제거해도 무방
});

// 요청 인터셉터
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 토큰 주입
  if (!isAuthPath(config.url)) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }

  // FormData면 Content-Type 제거 → 브라우저가 boundary 포함해 자동 설정
  const data = (config as any).data;
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    if (config.headers) {
      delete (config.headers as any)["Content-Type"];
      delete (config.headers as any)["content-type"];
    }
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

    if (isAuthPath(original?.url)) {
      return normReject(error);
    }

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
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
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
