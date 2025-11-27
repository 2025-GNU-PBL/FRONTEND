import { createAsyncThunk } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import api from "../lib/api/axios";
import type { RootState } from "./store";

export type UserRole = "CUSTOMER" | "OWNER";

type SocialLoginPayload = {
  code: string;
  state?: string | null;
  role: UserRole;
};

type AuthResponse = {
  accessToken?: string;
};

/* --------------------------- 소셜 로그인 --------------------------- */

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

/* ----------------------------- 로그아웃 ---------------------------- */

export const logoutUser = createAsyncThunk("user/logoutUser", async () => {
  try {
    return { server: true };
  } catch (error) {
    if (isAxiosError(error)) {
      console.warn("logoutUser server error:", error.response?.status);
    }
    return { server: false };
  }
});

/* ------------------------- 인증 조회 (GET) ------------------------- */

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

/* -------------------------- 공통 유틸 함수 -------------------------- */

const normalizePhone = (raw: string | undefined) => {
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

/* ------------------------ 고객 회원가입 ------------------------ */

type SignupValues = {
  phone?: string;
  address?: string;
  zipCode?: string;
  roadAddress?: string;
  jibunAddress?: string;
  detailAddress?: string;
  sido?: string;
  sigungu?: string;
  dong?: string;
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

    const d: Partial<SignupValues> =
      (maybeValues && Object.keys(maybeValues).length > 0
        ? maybeValues
        : fromState) || {};

    if (!d || Object.keys(d).length === 0) {
      return rejectWithValue("가입 정보가 비어 있습니다.");
    }

    const payload = toNullIfEmpty({
      phoneNumber: normalizePhone(d.phone),

      address: d.address || "",
      zipCode: d.zipCode || "",
      roadAddress: d.roadAddress || "",
      jibunAddress: d.jibunAddress || "",
      detailAddress: d.detailAddress || "",

      sido: d.sido || "",
      sigungu: d.sigungu || "",
      dong: d.dong || "",
      buildingName: d.buildingName || "",

      weddingSido: d.weddingSido || "",
      weddingSigungu: d.weddingSigungu || "",
      weddingDate: safeDate(d.weddingDate ?? undefined),

      age: 18,
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

/* ----------------------- 사장 회원가입 ------------------------ */

type OwnerSignupValues = {
  phoneNumber?: string; // step1
  bzName?: string; // step3
  bzNumber?: string; // step3
  bankAccount?: string; // step3
  bankName?: string; // ✅ step3 추가
  profileImage?: string | null;

  zipCode?: string; // step2 (옵션)
  roadAddress?: string; // step2 (옵션)
  jibunAddress?: string; // step2 (옵션)
  detailAddress?: string; // step2 (옵션)
  buildingName?: string; // step2 (옵션)
};

export const submitOwnerSignup = createAsyncThunk<
  { ok: true } & Record<string, any>,
  OwnerSignupValues | void,
  { state: RootState }
>(
  "signup/submitOwnerSignup",
  async (maybeValues, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const fromState = (state as any)?.ownerSignup?.values as
        | Partial<OwnerSignupValues>
        | undefined;

      // 인자로 들어온 값 우선, 없으면 Redux 저장값 사용
      const d: OwnerSignupValues =
        (maybeValues && Object.keys(maybeValues).length > 0
          ? maybeValues
          : fromState) || {};

      const phoneNumber = d.phoneNumber?.trim();
      const bzName = d.bzName?.trim();
      const bzNumber = d.bzNumber?.trim();
      const bankAccount = d.bankAccount?.trim();
      const bankName = d.bankName?.trim(); // ✅ 은행명

      // DTO 기준 필수 5개 검증 (phoneNumber, bzName, bzNumber, bankAccount, bankName)
      if (!phoneNumber || !bzName || !bzNumber || !bankAccount || !bankName) {
        console.error("[submitOwnerSignup] missing required:", {
          phoneNumber,
          bzName,
          bzNumber,
          bankAccount,
          bankName,
        });
        return rejectWithValue("사장 회원가입 정보가 충분하지 않습니다.");
      }

      const payload = {
        profileImage: (d.profileImage ?? "").toString(), // "" 또는 url, 500자 이내

        phoneNumber: normalizePhone(phoneNumber),
        bzNumber,
        bankAccount,
        bzName,
        bankName, // ✅ payload에 추가

        // 아래는 전부 optional
        zipCode: d.zipCode ?? "",
        roadAddress: d.roadAddress ?? "",
        jibunAddress: d.jibunAddress ?? "",
        detailAddress: d.detailAddress ?? "",
        buildingName: d.buildingName ?? "",
      };

      console.log("[submitOwnerSignup] payload:", payload);

      const res = await api.post("/api/v1/owner", payload);

      console.log("[submitOwnerSignup] response:", res.data);
      return { ok: true, ...res.data };
    } catch (error) {
      if (isAxiosError(error)) {
        console.error(
          "[submitOwnerSignup] axios error:",
          error.response?.status,
          error.response?.data
        );
        return rejectWithValue(error.response?.data || error.message);
      }
      return rejectWithValue("사장 회원가입 정보 제출 실패");
    }
  }
);

/* ---------------------- 사장 정보 수정 (PATCH) ---------------------- */

export type OwnerUpdateValues = {
  profileImage?: string | null;
  phoneNumber?: string;
  bzName?: string;
  bzNumber?: string;
  bankAccount?: string;
  bankName?: string; // ✅ 수정에도 은행명 포함
  zipCode?: string;
  roadAddress?: string;
  jibunAddress?: string;
  detailAddress?: string;
  buildingName?: string;
};

export const updateOwnerInfo = createAsyncThunk<
  { ok: true } & Record<string, any>,
  OwnerUpdateValues,
  { state: RootState }
>("owner/updateOwnerInfo", async (values, { rejectWithValue, dispatch }) => {
  try {
    const payload = toNullIfEmpty({
      profileImage: (values.profileImage ?? "").toString(),
      phoneNumber: normalizePhone(values.phoneNumber),
      bzNumber: values.bzNumber || "",
      bankAccount: values.bankAccount || "",
      bzName: values.bzName || "",
      bankName: values.bankName || "", // ✅ PATCH payload에 bankName 추가
      zipCode: values.zipCode || "",
      roadAddress: values.roadAddress || "",
      jibunAddress: values.jibunAddress || "",
      detailAddress: values.detailAddress || "",
      buildingName: values.buildingName || "",
    });

    console.log("[updateOwnerInfo] payload:", payload);

    const res = await api.patch("/api/v1/owner", payload);

    // 수정 후 최신 정보 다시 가져와 userSlice.userData 갱신
    await dispatch(authOwner()).unwrap();

    console.log("[updateOwnerInfo] response:", res.data);
    return { ok: true, ...res.data };
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(
        "[updateOwnerInfo] axios error:",
        error.response?.status,
        error.response?.data
      );
      return rejectWithValue(error.response?.data || error.message);
    }
    return rejectWithValue("사장 정보 수정 실패");
  }
});
