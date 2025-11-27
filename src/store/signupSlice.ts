// src/store/signupSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

/* ===========================
 *   고객(CUSTOMER) 회원가입 Draft
 * =========================== */
export interface ClientSignupDraft {
  phone: string;
  zipCode: string;
  roadAddress: string;
  jibunAddress: string;
  detailAddress: string;
  address: string;
  buildingName: string;
  weddingDate: string;
  weddingSido: string;
  weddingSigungu: string;
}

/* ===========================
 *   사장(OWNER) 회원가입 Draft (모두 필수값)
 * =========================== */
export interface OwnerSignupDraft {
  phoneNumber: string;
  bzName: string;
  bzNumber: string;
  bankAccount: string;
  bankName: string; // ✅ 은행명 추가
  profileImage: string; // 필수
  zipCode: string; // 필수
  roadAddress: string; // 필수
  jibunAddress: string; // 필수
  detailAddress: string; // 필수
  buildingName: string; // 필수
}

/* ===========================
 *   Slice State
 * =========================== */
export interface SignupState {
  client: ClientSignupDraft;
  owner: OwnerSignupDraft;
}

const initialState: SignupState = {
  client: {
    phone: "",
    zipCode: "",
    roadAddress: "",
    jibunAddress: "",
    detailAddress: "",
    address: "",
    buildingName: "",
    weddingDate: "",
    weddingSido: "",
    weddingSigungu: "",
  },
  owner: {
    phoneNumber: "",
    bzName: "",
    bzNumber: "",
    bankAccount: "",
    bankName: "", // ✅ 초기값 추가
    profileImage: "",
    zipCode: "",
    roadAddress: "",
    jibunAddress: "",
    detailAddress: "",
    buildingName: "",
  },
};

/* ===========================
 *   Slice
 * =========================== */
const signupSlice = createSlice({
  name: "signup",
  initialState,
  reducers: {
    /* 고객 */
    setClientDraft(state, action: PayloadAction<Partial<ClientSignupDraft>>) {
      state.client = { ...state.client, ...action.payload };
    },
    resetClientDraft(state) {
      state.client = { ...initialState.client };
    },

    /* 사장 */
    setOwnerDraft(state, action: PayloadAction<Partial<OwnerSignupDraft>>) {
      state.owner = { ...state.owner, ...action.payload };
    },
    resetOwnerDraft(state) {
      state.owner = { ...initialState.owner };
    },
  },
});

export default signupSlice.reducer;

/* 액션 */
export const {
  setClientDraft,
  resetClientDraft,
  setOwnerDraft,
  resetOwnerDraft,
} = signupSlice.actions;

/* 고객 호환용 export */
export const setDraft = setClientDraft;
export const resetDraft = resetClientDraft;

/* 셀렉터 */
export const selectClientSignupValues = (state: { signup: SignupState }) =>
  state.signup.client;

export const selectOwnerSignupValues = (state: { signup: SignupState }) =>
  state.signup.owner;

/* 고객 호환용 */
export const selectSignupValues = selectClientSignupValues;
