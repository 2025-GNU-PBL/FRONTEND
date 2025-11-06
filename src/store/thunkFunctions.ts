import { createAsyncThunk } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import api from "../lib/api/axios";

export type UserRole = "CUSTOMER" | "OWNER";

// 회원가입
type RegisterBody = {
  age: number;
  phoneNumber: string;
  address: string;
};

export const registerUser = createAsyncThunk(
  "user/registerUser",
  async (body: RegisterBody, thunkAPI) => {
    try {
      const res = await api.post("/api/v1/customer", body);
      return res.data;
    } catch (error) {
      if (isAxiosError(error)) {
        return thunkAPI.rejectWithValue(error.response?.data || error.message);
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
);

// ✅ 소셜 로그인 공통 payload
type SocialLoginPayload = {
  code: string;
  state?: string | null;
  role: UserRole; // 페이지(사장/고객)에서 명시적으로 전달
};

// 응답 타입(예시). 서버가 role도 함께 주면 반영 가능.
type AuthResponse = {
  accessToken?: string;
  // role?: UserRole;
};

// ✅ 카카오 로그인
export const kakaoLoginUser = createAsyncThunk(
  "user/kakaoLoginUser",
  async ({ code, state, role }: SocialLoginPayload, thunkAPI) => {
    try {
      const res = await api.post<AuthResponse>("/api/v1/auth/login", {
        code,
        socialProvider: "KAKAO",
        userRole: role,
        state,
      });
      return res.data;
    } catch (error) {
      if (isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data || "카카오 로그인 실패"
        );
      }
      return thunkAPI.rejectWithValue("카카오 로그인 실패");
    }
  }
);

// ✅ 네이버 로그인
export const naverLoginUser = createAsyncThunk(
  "user/naverLoginUser",
  async ({ code, state, role }: SocialLoginPayload, thunkAPI) => {
    try {
      const res = await api.post<AuthResponse>("/api/v1/auth/login", {
        code,
        socialProvider: "NAVER",
        userRole: role,
        state,
      });
      return res.data;
    } catch (error) {
      if (isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data || "네이버 로그인 실패"
        );
      }
      return thunkAPI.rejectWithValue("네이버 로그인 실패");
    }
  }
);

export const logoutUser = createAsyncThunk("user/logoutUser", async () => {
  try {
    const res = await api.post("/api/v1/auth/logout"); // 200/204 기대
    return { server: true, data: res.data };
  } catch (error) {
    if (isAxiosError(error)) {
      console.warn("logoutUser server error:", error.response?.status);
    }
    // 서버 실패라도 클라 로그아웃은 진행 가능하므로 fulfilled로 처리
    return { server: false };
  }
});

// ✅ 고객 인증
export const authCustomer = createAsyncThunk(
  "user/authCustomer",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/v1/customer");
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data || "고객 인증 조회 실패"
        );
      }
      return thunkAPI.rejectWithValue("고객 인증 조회 실패");
    }
  }
);

// ✅ 사장 인증
export const authOwner = createAsyncThunk(
  "user/authOwner",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/v1/owner");
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data || "사장 인증 조회 실패"
        );
      }
      return thunkAPI.rejectWithValue("사장 인증 조회 실패");
    }
  }
);
