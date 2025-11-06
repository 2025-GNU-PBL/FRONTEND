// userSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  kakaoLoginUser,
  naverLoginUser,
  registerUser,
  logoutUser,
  authCustomer,
  authOwner,
} from "./thunkFunctions";
import { toast } from "react-toastify";

/** =========================
 *  1) 공통 타입 / 역할
 * ========================= */
export type UserRole = "CUSTOMER" | "OWNER";

export type AccessTokenPayload = {
  accessToken?: string;
  // 서버가 role을 곧바로 내려주면 여기에 포함 가능: role?: UserRole;
};

/** =========================
 *  2) 서버 응답 타입 (원본)
 *     - 서버 스펙 그대로 반영 (예시)
 * ========================= */
// OWNER 응답 예시
export type OwnerApiResponse = {
  id: number;
  profileImage: string;
  age: number;
  phoneNumber: string;
  bzNumber: string;
  bankAccount: string;
  userRole: string;
  email: string;
  name: string;
  socialId: string;
  socialProvider: "KAKAO" | "NAVER" | string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

// CUSTOMER 응답 예시
export type CustomerApiResponse = {
  id: number;
  name: string;
  email: string;
  socialId: string;
  age: number;
  phoneNumber: string;
  address: string;
  zipCode: string;
  roadAddress: string;
  jibunAddress: string;
  detailAddress: string;
  sido: string;
  sigungu: string;
  dong: string;
  buildingName: string;
  weddingSido: string;
  weddingSigungu: string;
  weddingDate: string; // YYYY-MM-DD
};

/** =========================
 *  3) 프론트 표준화 타입 (Discriminated Union)
 *     - userRole 로 구분
 * ========================= */
type UserBase = {
  id: number;
  name: string;
  email: string;
  socialId: string;
  age: number;
  phoneNumber: string;
};

// 사장 데이터(프론트 표준)
export type OwnerData = UserBase & {
  userRole: string;
  profileImage: string;
  bzNumber: string;
  bankAccount: string;
  socialProvider: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

// 고객 데이터(프론트 표준)
export type CustomerData = UserBase & {
  address: string;
  zipCode: string;
  roadAddress: string;
  jibunAddress: string;
  detailAddress: string;
  sido: string;
  sigungu: string;
  dong: string;
  buildingName: string;
  weddingSido: string;
  weddingSigungu: string;
  weddingDate: string; // YYYY-MM-DD
};

// ⛳ 최종 UserData: 역할로 타입이 자동 분기됨
export type UserData = OwnerData | CustomerData;

/** =========================
 *  4) 매핑 함수
 *     - 서버 응답 → 프론트 표준 UserData
 * ========================= */
function mapOwner(resp: OwnerApiResponse): OwnerData {
  return {
    id: resp.id,
    name: resp.name,
    email: resp.email,
    socialId: resp.socialId,
    age: resp.age,
    phoneNumber: resp.phoneNumber,
    profileImage: resp.profileImage,
    bzNumber: resp.bzNumber,
    bankAccount: resp.bankAccount,
    socialProvider: resp.socialProvider,
    createdAt: resp.createdAt,
    updatedAt: resp.updatedAt,
    userRole: resp.userRole,
  };
}

function mapCustomer(resp: CustomerApiResponse): CustomerData {
  return {
    id: resp.id,
    name: resp.name,
    email: resp.email,
    socialId: resp.socialId,
    age: resp.age,
    phoneNumber: resp.phoneNumber,
    address: resp.address,
    zipCode: resp.zipCode,
    roadAddress: resp.roadAddress,
    jibunAddress: resp.jibunAddress,
    detailAddress: resp.detailAddress,
    sido: resp.sido,
    sigungu: resp.sigungu,
    dong: resp.dong,
    buildingName: resp.buildingName,
    weddingSido: resp.weddingSido,
    weddingSigungu: resp.weddingSigungu,
    weddingDate: resp.weddingDate,
  };
}

/** =========================
 *  5) 슬라이스 스테이트
 * ========================= */
type UserState = {
  userData: UserData | null;
  jwt: AccessTokenPayload | null;
  isAuth: boolean;
  isLoading: boolean;
  error: string | null;
  role: UserRole | null; // 최종 확정된 역할
};

const initialState: UserState = {
  userData: null,
  jwt: null,
  isAuth: false,
  isLoading: false,
  error: null,
  role: null,
};

/** =========================
 *  6) 슬라이스
 * ========================= */
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    forceLogout(state) {
      state.isAuth = false;
      state.userData = null;
      state.error = null;
      state.jwt = null;
      state.role = null;
      localStorage.removeItem("accessToken");
      toast.info("로그아웃 되었습니다.");
    },
  },
  extraReducers: (builder) => {
    /** 회원가입 */
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state) => {
      state.isLoading = false;
      toast.info("회원가입을 성공했습니다.");
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      const errorMessage =
        typeof action.payload === "string"
          ? action.payload
          : "An unknown error occurred";
      state.error = errorMessage;
      toast.error(errorMessage);
    });

    /** 카카오 로그인 */
    builder.addCase(kakaoLoginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      kakaoLoginUser.fulfilled,
      (
        state,
        action: PayloadAction<
          AccessTokenPayload,
          string,
          { arg: { code: string; state?: string | null; role: UserRole } }
        >
      ) => {
        state.isLoading = false;
        state.jwt = action.payload;
        state.isAuth = true;

        // 임시 역할(페이지에서 요청한 역할) — 이후 auth*로 최종 확정
        state.role = action.meta.arg.role;

        if (action.payload?.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
      }
    );
    builder.addCase(kakaoLoginUser.rejected, (state, action) => {
      state.isLoading = false;
      const errorMessage =
        typeof action.payload === "string"
          ? action.payload
          : "카카오 로그인 실패";
      state.error = errorMessage;
      toast.error(errorMessage);
    });

    /** 네이버 로그인 */
    builder.addCase(naverLoginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      naverLoginUser.fulfilled,
      (
        state,
        action: PayloadAction<
          AccessTokenPayload,
          string,
          { arg: { code: string; state?: string | null; role: UserRole } }
        >
      ) => {
        state.isLoading = false;
        state.jwt = action.payload;
        state.isAuth = true;

        // 임시 역할
        state.role = action.meta.arg.role;

        if (action.payload?.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
      }
    );
    builder.addCase(naverLoginUser.rejected, (state, action) => {
      state.isLoading = false;
      const errorMessage =
        typeof action.payload === "string"
          ? action.payload
          : "네이버 로그인 실패";
      state.error = errorMessage;
      toast.error(errorMessage);
    });

    /** 로그아웃 */
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isAuth = false;
      state.userData = null;
      state.error = null;
      state.jwt = null;
      state.role = null;
      localStorage.removeItem("accessToken");
      toast.info("로그아웃 되었습니다.");
    });
    builder.addCase(logoutUser.rejected, (state) => {
      state.isAuth = false;
      state.userData = null;
      state.error = null;
      state.jwt = null;
      state.role = null;
      localStorage.removeItem("accessToken");
      // 토스트 없음
    });

    /** ✅ 인증 유저 조회 (고객) */
    builder.addCase(authCustomer.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      authCustomer.fulfilled,
      (state, action: PayloadAction<CustomerApiResponse>) => {
        state.isLoading = false;
        state.isAuth = true;
        state.userData = mapCustomer(action.payload); // ← 표준화
        state.role = "CUSTOMER"; // 최종 확정
      }
    );
    builder.addCase(authCustomer.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuth = false;
      const errorMessage =
        typeof action.payload === "string"
          ? action.payload
          : "인증 정보 확인 실패";
      state.error = errorMessage;
    });

    /** ✅ 인증 유저 조회 (사장) */
    builder.addCase(authOwner.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      authOwner.fulfilled,
      (state, action: PayloadAction<OwnerApiResponse>) => {
        state.isLoading = false;
        state.isAuth = true;
        state.userData = mapOwner(action.payload); // ← 표준화
        state.role = "OWNER"; // 최종 확정
      }
    );
    builder.addCase(authOwner.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuth = false;
      const errorMessage =
        typeof action.payload === "string"
          ? action.payload
          : "인증 정보 확인 실패";
      state.error = errorMessage;
    });
  },
});

export const { forceLogout } = userSlice.actions;
export default userSlice.reducer;
