// src/lib/auth/kakao.ts
export type UserRole = "CUSTOMER" | "OWNER";

export const buildKakaoAuthUrl = (role: UserRole) => {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID!;
  const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI!;
  const state = encodeURIComponent(JSON.stringify({ role }));

  return (
    "https://kauth.kakao.com/oauth/authorize" + // 카카오 인증 주소
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    // --- 이 부분이 핵심입니다 ---
    `&prompt=login` // 기존 세션을 무시하고 사용자에게 로그인 화면을 강제 요청
  );
};
