import { createAsyncThunk } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import api from "../lib/api/axios";

export type UserRole = "CUSTOMER" | "OWNER";

// 회원가입
import type { RootState } from "./store";

const normalizePhone = (raw: string) => {
  const d = (raw || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("010")) {
    return `010-${d.slice(3, 7)}-${d.slice(7)}`;
  }
  return raw || "";
};

const toNullIfEmpty = <T extends Record<string, any>>(obj: T): T => {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v === "" || v === undefined) out[k] = null;
    else out[k] = v;
  });
  return out as T;
};

const safeDate = (d?: string | null) => {
  if (!d) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
};

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

export const kakaoLoginUser = createAsyncThunk(
  "user/kakaoLoginUser",
  async ({ code, role, state }: SocialLoginPayload, thunkAPI) => {
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
      const res = await api.post<AuthResponse>("/api/v1/auth/login", {
        code,
        socialProvider: "NAVER",
        userRole: role,
        state,
      });
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
      return thunkAPI.fulfillWithValue({ server: false });
    }
  }
);

type SignupValues = {
  phone?: string;
  address?: string;
  zipCode?: string;
  roadAddress?: string;
  jibunAddress?: string;
  detailAddress?: string;
  sido?: string; // 없어질 예정
  sigungu?: string; // 없어질 예정
  dong?: string; // 없어질 예정
  buildingName?: string;
  weddingSido?: string;
  weddingSigungu?: string;
  weddingDate?: string | null;
};

export const submitSignup = createAsyncThunk<
  { ok: true } & Record<string, any>,
  Partial<SignupValues> | void,
  { state: RootState }
>("signup/submitSignup", async (maybeValues, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const fromState = (state as any)?.signup?.values as
      | Partial<SignupValues>
      | undefined;
    //  전달된 값이 있으면 그걸 사용, 없으면 Redux state 사용
    const d: Partial<SignupValues> =
      (maybeValues && Object.keys(maybeValues).length > 0
        ? maybeValues
        : fromState) || {};

    if (!d || Object.keys(d).length === 0) {
      return rejectWithValue("가입 정보가 비어 있습니다.");
    }

    const payload = toNullIfEmpty({
      phoneNumber: normalizePhone(d.phone || ""),

      address: d.address || "",
      zipCode: d.zipCode || "",
      roadAddress: d.roadAddress || "",
      jibunAddress: d.jibunAddress || "",
      detailAddress: d.detailAddress || "",

      sido: d.sido || "", // 없어질 예정
      sigungu: d.sigungu || "", // 없어질 예정
      dong: d.dong || "", // 없어질 예정
      buildingName: d.buildingName || "",

      weddingSido: d.weddingSido || "",
      weddingSigungu: d.weddingSigungu || "",
      weddingDate: safeDate(d.weddingDate ?? undefined),

      age: 18, // 없어질 예정
    });

    console.log("[submitSignup] payload:", payload);

    const res = await api.post("/api/v1/customer", payload);

    console.log("[submitSignup] response:", res.data);
    return { ok: true, ...res.data };
  } catch (error) {
    if (isAxiosError(error)) {
      console.error("[submitSignup] axios error:", error.response?.data);
      return rejectWithValue(error.response?.data || error.message);
    }
    return rejectWithValue("회원가입 정보 제출 실패");
  }
});
