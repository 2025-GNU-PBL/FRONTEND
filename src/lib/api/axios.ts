import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string; // ✅ 하나로 통일
if (!API_BASE) {
  console.error(
    "VITE_API_BASE_URL is not defined. Check your .env and restart dev server."
  );
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ===== 요청 인터셉터 =====
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  //  로그인/토큰 관련 요청에는 Authorization 헤더 절대 붙이지 않기
  const url = config.url || "";
  if (LOGIN_PATHS.some((p) => url.includes(p))) {
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

// 로그인 관련 요청(리프레시 대상 제외)
const LOGIN_PATHS = [
  "/auth/login",
  "/auth/kakao",
  "/auth/naver",
  "/auth/refresh",
];

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

    // ===== 기본 에러 메시지 정규화 =====
    const normReject = (e: AxiosError<any>) => {
      let message = e.message;
      const data = (e.response?.data ?? {}) as any;
      if (data?.message) message = data.message;
      return Promise.reject(new Error(message));
    };

    // ===== 가드: 로그인/리프레시 관련 요청은 무시 =====
    if (original?.url && LOGIN_PATHS.some((p) => original.url.includes(p))) {
      return normReject(error);
    }

    // ===== 만료 토큰 처리 =====
    if (
      response?.status === 401 &&
      response.data?.code === "AUTH4001" &&
      !original?._retry
    ) {
      if (isRefreshing) {
        // 이미 갱신 중이면 큐에 쌓기
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

        // refresh 요청은 plain axios로 (api 인스턴스 사용 X)
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          { refreshToken: rt },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAT = data?.data?.accessToken;
        const newRT = data?.data?.refreshToken;
        setTokens(newAT, newRT);

        // 대기 중이던 요청들 재시도
        waiters.forEach((fn) => fn(newAT));
        waiters = [];

        // 원래 요청 재시도
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAT}`;
        return api(original);
      } catch (e) {
        // refresh 실패 → 토큰 제거 + 재로그인 유도
        clearTokens();
        return normReject(e as AxiosError<any>);
      } finally {
        isRefreshing = false;
      }
    }

    // ===== 나머지 에러 =====
    return normReject(error);
  }
);

export default api;
