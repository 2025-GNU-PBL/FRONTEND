import { createAsyncThunk } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import api from "../lib/api/axios";
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

      console.log("[kakaoLoginUser] request body:", body);

      const res = await api.post("/api/v1/auth/login", body);
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
      return thunkAPI.fulfillWithValue({ server: false });
    }
  }
);

export const authUser = createAsyncThunk(
  "user/authUser",
  async (_, thunkAPI) => {
    try {
      const res = await api.get("/api/v1/customer");
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
