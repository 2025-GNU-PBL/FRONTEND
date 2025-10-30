// src/lib/auth/tokenStorage.ts
export const setTokens = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("persist:root");
};

export const getAccessToken = () => localStorage.getItem("accessToken") ?? null;
export const getRefreshToken = () =>
  localStorage.getItem("refreshToken") ?? null;
