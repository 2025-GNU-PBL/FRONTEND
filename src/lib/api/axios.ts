import axios, { AxiosError } from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  // timeout: 10000, // 필요 시 주석 해제
});

//  요청 인터셉터: 액세스 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//  응답 인터셉터: 에러 메시지 정규화
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    let message = error.message;
    const data = (error.response?.data ?? {}) as any;
    if (data?.message) message = data.message;
    return Promise.reject(new Error(message));
  }
);

export default api;
