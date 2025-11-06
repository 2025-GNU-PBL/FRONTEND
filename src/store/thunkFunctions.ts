import { createAsyncThunk } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import api from "../lib/api/axios";

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
  role: "CUSTOMER" | "OWNER";
};

// ✅ 카카오 로그인
export const kakaoLoginUser = createAsyncThunk(
  "user/kakaoLoginUser",
  async ({ code, state, role }: SocialLoginPayload, thunkAPI) => {
    try {
      const res = await api.post("/api/v1/auth/login", {
        code,
        socialProvider: "KAKAO",
        userRole: role,
        state,
      });
      return res.data; // { id, email, name, role, image?, accessToken? }
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
      const res = await api.post("/api/v1/auth/login", {
        code,
        socialProvider: "NAVER",
        userRole: role,
        state,
      });
      return res.data; // { id, email, name, role, image?, accessToken? }
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

export const logoutUser = createAsyncThunk(
  "user/logoutUser",
  async (_, thunkAPI) => {
    try {
      const res = await api.post("/api/v1/auth/logout"); // 200/204 기대
      return { server: true, data: res.data };
    } catch (error) {
      // 👇 서버 실패/네트워크 이슈여도 클라이언트 로그아웃은 '성공'으로 처리
      if (isAxiosError(error)) {
        // 필요하다면 에러 로깅만
        console.warn("logoutUser server error:", error.response?.status);
      }
      return thunkAPI.fulfillWithValue({ server: false }); // ✅ rejected 대신 fulfilled로 보냄
    }
  }
);

export const authUser = createAsyncThunk(
  "user/authUser",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/v1/customer");
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        // 필요하다면 에러 로깅만
        console.warn("logoutUser server error:", error.response?.status);
      }
      return thunkAPI.fulfillWithValue({ server: false }); // ✅ rejected 대신 fulfilled로 보냄
    }
  }
);
