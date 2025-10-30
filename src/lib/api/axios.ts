// src/lib/api/axios.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
if (!API_BASE) {
  // eslint-disable-next-line no-console
  console.error(
    "VITE_API_BASE_URL is not defined. Check your .env and restart dev server."
  );
}

// 로그인/토큰 관련 엔드포인트들 (상단에서 먼저 선언)
const AUTH_PATHS = [
  // 상대경로/절대경로 모두 매칭될 수 있게 넉넉하게 넣어둠
  "/api/v1/auth/login",
  "/auth/login",
  "/auth/kakao",
  "/auth/naver",
  "/auth/refresh",
];

// 해당 요청이 인증(로그인/리프레시) 관련인지 판별
const isAuthPath = (url?: string | null) => {
  if (!url) return false;
  return AUTH_PATHS.some((p) => url.includes(p));
};

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ===== 요청 인터셉터 =====
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 로그인/리프레시 관련 요청에는 Authorization 절대 첨부 X
  if (isAuthPath(config.url)) {
    return config;
  }

  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};

    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== 응답 인터셉터 =====
let isRefreshing = false;
let waiters: Array<(t: string) => void> = [];

const setTokens = (at: string, rt?: string) => {
  localStorage.setItem("accessToken", at);
  if (rt) localStorage.setItem("refreshToken", rt);
};
const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("persist:root");
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const { response, config } = error;
    const original = config as any;

    // 공통 에러 정규화
    const normReject = (e: AxiosError<any>) => {
      let message = e.message;
      const data = (e.response?.data ?? {}) as any;
      if (data?.message) message = data.message;
      return Promise.reject(new Error(message));
    };

    // 로그인/리프레시 요청 자체의 실패는 그대로 내보냄 (리프레시 재시도 금지)
    if (isAuthPath(original?.url)) {
      return normReject(error);
    }

    // 액세스 토큰 만료 처리
    if (
      response?.status === 401 &&
      response.data?.code === "AUTH4001" &&
      !original?._retry
    ) {
      // 이미 다른 요청이 리프레시 중이면 큐에 대기
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
        const rt = localStorage.getItem("refreshToken");
        if (!rt) throw new Error("No refresh token found.");

        // ⚠️ 순환참조 방지: refresh는 plain axios 사용
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          { refreshToken: rt },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAT = data?.data?.accessToken;
        const newRT = data?.data?.refreshToken;
        if (!newAT) throw new Error("No access token from refresh response.");

        setTokens(newAT, newRT);

        // 대기 중이던 요청들 재시도
        waiters.forEach((fn) => fn(newAT));
        waiters = [];

        // 원래 요청 재시도
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

    // 그 외 에러
    return normReject(error);
  }
);

export default api;
