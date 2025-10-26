// 사용자의 역할 (고객 / 업체)
export type UserRole = "CUSTOMER" | "OWNER";

// 소셜 로그인 제공자
export type SocialProvider = "KAKAO";

// 로그인 API 응답 형식
export interface LoginResponse {
  accessToken: string; // 서버에서 받은 액세스 토큰
  refreshToken?: string; // 선택적: 서버가 제공할 경우 대비
  expiresIn?: number; // 선택적: 토큰 만료 시간 (초 단위)
}
