// 사용자의 역할
export type UserRole = "CUSTOMER" | "OWNER";

// 소셜 로그인 제공자
export type SocialProvider = "KAKAO" | "NAVER";

// 로그인 API 응답 형식
export interface LoginResponse {
  accessToken: string; // 서버에서 받은 액세스 토큰
  refreshToken?: string; // 서버가 제공할 경우 대비
  expiresIn?: number; // 토큰 만료 시간
}
