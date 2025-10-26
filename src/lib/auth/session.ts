import type { LoginResponse, UserRole } from "./types";

export function saveSession(res: LoginResponse, role: UserRole) {
  localStorage.setItem("accessToken", res.accessToken);

  // 서버가 줄 때만 저장 (optional 안전 처리)
  if ("refreshToken" in res && res.refreshToken) {
    localStorage.setItem("refreshToken", String(res.refreshToken));
  }

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userRole", role);
}

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
}
