// src/store/thunkFunctions.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import api from "../lib/api/axios";
import type { RootState } from "./store";

/* =========================================================================
 * 공통 유틸
 * ========================================================================= */

// 010-1234-5678 포맷으로 정규화
const normalizePhone = (raw: string) => {
  const d = (raw || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("010")) {
    return `010-${d.slice(3, 7)}-${d.slice(7)}`;
  }
  return raw || "";
};

// ""(빈문자) -> null 로 바꿔 백엔드 DTO와 깔끔히 맞추기
const toNullIfEmpty = <T extends Record<string, any>>(obj: T): T => {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v === "" || v === undefined) out[k] = null;
    else out[k] = v;
  });
  return out as T;
};

// YYYY-MM-DD 형식 검증 (맞으면 그대로, 아니면 null)
const safeDate = (d?: string | null) => {
  if (!d) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
};

/* =========================================================================
 * 회원 계정(기존)
 * ========================================================================= */

type RegisterBody = {
  name: string;
  email: string;
  password: string;
  role: number;
};

export const registerUser = createAsyncThunk(
  "user/registerUser",
  async (body: RegisterBody, thunkAPI) => {
    try {
      const res = await api.post("/api/users/register", body);
      return res.data;
    } catch (error) {
      if (isAxiosError(error)) {
        return thunkAPI.rejectWithValue(error.response?.data || error.message);
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred");
    }
  }
);

/* =========================================================================
 * 소셜 로그인
 *  - 백엔드 스펙: { code, socialProvider: "KAKAO"|"NAVER", userRole, (state?) }
 *  - 일부 환경에서 state 검증이 필요하므로 '있으면 포함' 방식
 * ========================================================================= */

type SocialLoginPayload = {
  code: string;
  role: "CUSTOMER" | "OWNER";
  state?: string | null;
};

export const kakaoLoginUser = createAsyncThunk(
  "user/kakaoLoginUser",
  async ({ code, role, state }: SocialLoginPayload, thunkAPI) => {
    try {
      const body: Record<string, any> = {
        code,
        socialProvider: "KAKAO",
        userRole: role,
        ...(state != null ? { state } : {}),
      };

      // 디버깅
      console.log("[kakaoLoginUser] request body:", body);

      const res = await api.post("/api/v1/auth/login", body);
      return res.data; // { id, email, name, role, accessToken? ... }
    } catch (error) {
      if (isAxiosError(error)) {
        console.error(
          "kakaoLoginUser error:",
          error.response?.status,
          error.response?.data
        );
        return thunkAPI.rejectWithValue(
          error.response?.data || "카카오 로그인 실패"
        );
      }
      return thunkAPI.rejectWithValue("카카오 로그인 실패");
    }
  }
);

export const naverLoginUser = createAsyncThunk(
  "user/naverLoginUser",
  async ({ code, role, state }: SocialLoginPayload, thunkAPI) => {
    try {
      const body: Record<string, any> = {
        code,
        socialProvider: "NAVER",
        userRole: role,
        ...(state != null ? { state } : {}),
      };

      console.log("[naverLoginUser] request body:", body);

      const res = await api.post("/api/v1/auth/login", body);
      return res.data;
    } catch (error) {
      if (isAxiosError(error)) {
        console.error(
          "naverLoginUser error:",
          error.response?.status,
          error.response?.data
        );
        return thunkAPI.rejectWithValue(
          error.response?.data || "네이버 로그인 실패"
        );
      }
      return thunkAPI.rejectWithValue("네이버 로그인 실패");
    }
  }
);

/* =========================================================================
 * 로그아웃 / 인증 유저
 * ========================================================================= */

export const logoutUser = createAsyncThunk(
  "user/logoutUser",
  async (_, thunkAPI) => {
    try {
      const res = await api.post("/api/v1/auth/logout");
      return { server: true, data: res.data };
    } catch (error) {
      if (isAxiosError(error)) {
        console.warn("logoutUser server error:", error.response?.status);
      }
      // 서버 실패여도 클라에서는 성공 처리
      return thunkAPI.fulfillWithValue({ server: false });
    }
  }
);

export const authUser = createAsyncThunk(
  "user/authUser",
  async (_, thunkAPI) => {
    try {
      const res = await api.get("/api/v1/auth/me");
      return res.data;
    } catch (error) {
      if (isAxiosError(error)) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("persist:root");
        return thunkAPI.rejectWithValue(
          error.response?.data || "인증 정보 확인 실패"
        );
      }
      return thunkAPI.rejectWithValue("인증 정보 확인 실패");
    }
  }
);

const CUSTOMER_CREATE_ENDPOINT = "/api/v1/customers";

export const submitSignup = createAsyncThunk<
  { ok: true },
  void,
  { state: RootState }
>("signup/submitSignup", async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const d = state.signup.values;

    const payload = toNullIfEmpty({
      phoneNumber: normalizePhone(d.phone),

      address: d.address,
      zipCode: d.zipCode,
      roadAddress: d.roadAddress,
      jibunAddress: d.jibunAddress,
      detailAddress: d.detailAddress,

      sido: d.sido,
      sigungu: d.sigungu,
      dong: d.dong,
      buildingName: d.buildingName,

      weddingSido: d.weddingSido,
      weddingSigungu: d.weddingSigungu,
      weddingDate: safeDate(d.weddingDate),
    });

    // 디버깅
    console.log("[submitSignup] payload:", payload);

    const res = await api.post(CUSTOMER_CREATE_ENDPOINT, payload);
    return { ok: true, ...res.data };
  } catch (error) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data || error.message);
    }
    return rejectWithValue("회원가입 정보 제출 실패");
  }
});
