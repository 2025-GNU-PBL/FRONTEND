// src/lib/auth/api.ts
import api from "../api/axios";
import type { LoginResponse, UserRole } from "./types";

export async function loginWithKakao(params: { code: string; role: UserRole }) {
  const { code, role } = params;

  const body = {
    code,
    socialProvider: "KAKAO",
    userRole: role,
  };

  // 디버깅: 내가 보내는 값 확인
  console.log("[loginWithKakao] request", body);

  const res = await api.post<LoginResponse>("/api/v1/auth/login", body, {
    headers: { "Content-Type": "application/json" },
  });

  return res.data; // { accessToken }
}
