import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearTokens, getRefreshToken, setTokens } from "../auth/tokenStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
if (!API_BASE) {
  console.error(
    "VITE_API_BASE_URL is not defined. Check your .env and restart dev server."
  );
}

// 로그인/토큰 관련 엔드포인트들 (path 기준)
const AUTH_PATHS = [
  "/api/v1/auth/login",
  "/auth/login",
  "/auth/kakao",
  "/auth/naver",
  "/auth/refresh",
] as const;

// 성능/정확도 위해 Set 사용
const AUTH_SET = new Set<string>(AUTH_PATHS);

/** 주어진 URL을 API_BASE 기준으로 파싱해 pathname만 반환 */
const toPathname = (url?: string): string | null => {
  if (!url) return null;
  try {
    // 절대 URL이면 그대로, 상대경로면 API_BASE 기준으로 절대 URL 구성
    const u = url.startsWith("http")
      ? new URL(url)
      : new URL(url, API_BASE.endsWith("/") ? API_BASE : API_BASE + "/");
    // trailing slash는 제거하지 않고 그대로 둠 (AUTH_PATHS와 동일해야 매치됨)
    return u.pathname;
  } catch {
    // URL 생성이 실패하는 edge 케이스(특수문자 등)는 startsWith 비교로 fallback
    return url;
  }
};

/** 이 요청이 인증/토큰 관련 엔드포인트인지 여부 */
const isAuthPath = (url?: string) => {
  const path = toPathname(url);
  if (!path) return false;

  // 정확 매칭 우선
  if (AUTH_SET.has(path)) return true;

  // 혹시 백엔드에서 뒤에 또 세부 path가 붙는 경우를 위해 prefix 매칭도 보조적으로 허용
  // 예: /auth/login/kakao, /api/v1/auth/login/callback 등
  for (const p of AUTH_SET) {
    if (path === p || path.startsWith(p + "/")) return true;
  }
  return false;
};

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 인증/토큰 엔드포인트에는 Authorization 헤더를 붙이지 않음
  if (isAuthPath(config.url)) return config;

  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
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

    // 로그인/리프레시 요청 자체의 실패는 그대로 반환 (재시도 금지)
    if (isAuthPath(original?.url)) {
      return normReject(error);
    }

    // 액세스 토큰 만료 처리 (예: code=AUTH4001)
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

        // 주의: refresh 엔드포인트는 AUTH_PATHS에 있으므로 request 인터셉터에서 토큰 미부착
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          { refreshToken: rt },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAT = data?.data?.accessToken;
        const newRT = data?.data?.refreshToken;
        if (!newAT) throw new Error("No access token from refresh response.");

        setTokens(newAT, newRT);

        // 대기중 재요청 처리
        waiters.forEach((fn) => fn(newAT));
        waiters = [];

        // 원 요청 재시도
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
