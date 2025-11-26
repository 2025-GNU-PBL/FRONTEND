export type UserRole = "CUSTOMER" | "OWNER";

export const buildNaverAuthUrl = (role: UserRole) => {
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID!;
  const redirectUri = import.meta.env.VITE_NAVER_REDIRECT_URI!;
  const state = role;

  return (
    "https://nid.naver.com/oauth2.0/authorize" +
    `?response_type=code&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`
  );
};
