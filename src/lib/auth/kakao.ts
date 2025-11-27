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
    `&state=${state}`
    // `&prompt=login`
  );
};
