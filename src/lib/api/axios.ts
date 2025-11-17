import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { clearTokens, getRefreshToken, setTokens } from "../auth/tokenStorage";
import { type Notification } from "../../type/notification";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
if (!API_BASE) {
  console.error(
    "VITE_API_BASE_URL is not defined. Check your .env and restart dev server."
  );
}

/**
 * 인증 관련 경로 (요청 시 Authorization 헤더 주입/제외 및 에러 처리 분기)
 * - 상대/절대 경로 모두 대응: includes 로 검사
 */
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
  // 전역 Content-Type 미설정 (각 요청에서 결정)
  withCredentials: true, // 쿠키/세션이 필요 없으면 false로 변경 가능
});

// 리프레시 요청은 인터셉터 영향 안 받도록 별도 인스턴스 사용
const refreshApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

/** axios config에 재시도 플래그 확장 */
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** 만료 판단 유틸: 서버가 400을 던져도 message/code로 만료를 감지 */
const isTokenExpiredError = (err: AxiosError<any>) => {
  const status = err.response?.status;
  const data: any = err.response?.data ?? {};
  const code = data?.code;
  const msg: string = (data?.message ?? err.message ?? "").toString();

  // 상태코드로 1차 판정
  if (status === 401 || status === 403) return true;

  // 일부 서버는 만료를 400으로 주는 경우가 있어 보정
  if (status === 400) {
    // 백엔드가 주는 코드 케이스를 넓게 허용
    const tokenExpiredCodes = new Set([
      "AUTH4001",
      "TOKEN_EXPIRED",
      "JWT_EXPIRED",
      "ACCESS_TOKEN_EXPIRED",
    ]);
    if (code && tokenExpiredCodes.has(String(code))) return true;

    // 메시지 패턴으로 보정 (다국어/문구 변형 대응)
    const lowered = msg.toLowerCase();
    if (
      lowered.includes("만료") ||
      lowered.includes("expire") ||
      lowered.includes("expired") ||
      lowered.includes("token is expired") ||
      lowered.includes("jwt expired")
    ) {
      return true;
    }
  }

  return false;
};

// 요청 인터셉터
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 인증 경로가 아니면 액세스 토큰 주입
  if (!isAuthPath(config.url)) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // AxiosHeaders 또는 일반 객체 모두 대응
      if (!config.headers) config.headers = new AxiosHeaders();
      const headers =
        config.headers instanceof AxiosHeaders
          ? (config.headers as AxiosHeaders)
          : (config.headers as Record<string, string>);

      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // FormData면 Content-Type 제거 → 브라우저가 boundary 포함 자동 설정
  const data = (config as any).data;
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    if (config.headers) {
      // 대소문자 케이스 모두 제거
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }

  return config;
});

let isRefreshing = false;
let waiters: Array<(newAT: string) => void> = [];

/** 대기중인 요청들 일괄 재개 */
const flushWaiters = (newAT: string) => {
  waiters.forEach((fn) => {
    try {
      fn(newAT);
    } catch {}
  });
  waiters = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const original = (error.config || {}) as RetryableConfig;

    // 인증 경로에서 난 에러는 그대로 정규화 반환
    if (isAuthPath(original?.url)) {
      return normalizeReject(error);
    }

    // 토큰 만료로 판단되고 아직 재시도 안 했으면 리프레시 시도
    if (isTokenExpiredError(error) && !original._retry) {
      // 이미 리프레시 중이면 큐에 대기 → 새 AT 수령 후 재요청
      if (isRefreshing) {
        return new Promise((resolve) => {
          waiters.push((newAT) => {
            original.headers = original.headers ?? {};
            (original.headers as any).Authorization = `Bearer ${newAT}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      original._retry = true;

      try {
        const rt = getRefreshToken();
        if (!rt) throw new Error("No refresh token found.");

        const { data } = await refreshApi.post("/auth/refresh", {
          refreshToken: rt,
        });

        const newAT: string | undefined = data?.data?.accessToken;
        const newRT: string | undefined = data?.data?.refreshToken;

        if (!newAT) throw new Error("No access token from refresh response.");
        setTokens(newAT, newRT);

        // 대기중인 요청들 재개
        flushWaiters(newAT);

        // 현재 요청 재시도
        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${newAT}`;
        return api(original);
      } catch (e) {
        // 리프레시 실패 → 토큰 제거
        clearTokens();
        return normalizeReject(e as AxiosError<any>);
      } finally {
        isRefreshing = false;
      }
    }

    // 그 외 에러는 메시지 정규화해서 그대로 리턴
    return normalizeReject(error);
  }
);

/** 에러 메시지 정규화: 서버의 data.message 우선, 없으면 Axios 기본 메시지 */
function normalizeReject(e: AxiosError<any>) {
  let message = e.message || "Request failed";
  const data = (e.response?.data ?? {}) as any;
  if (data?.message) message = String(data.message);
  return Promise.reject(new Error(message));
}

export function getAllNotifications() {
  return api.get<Notification[]>("/api/v1/notification");
}

export default api;
