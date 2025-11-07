import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// 회원가입 도중 임시 저장되는 입력 데이터 구조
export interface SignupDraft {
  // 기본 정보
  phone: string;

  // 주소 정보
  zipCode: string;
  roadAddress: string;
  jibunAddress: string;
  detailAddress?: string;
  address?: string;
  sido?: string;
  sigungu?: string;
  dong?: string;
  buildingName?: string;

  // 예식 정보
  weddingDate?: string; // YYYY-MM-DD
  weddingSido?: string;
  weddingSigungu?: string;
}

export interface SignupState {
  values: SignupDraft;
}

const initialState: SignupState = {
  values: {
    phone: "",
    zipCode: "",
    roadAddress: "",
    jibunAddress: "",
    detailAddress: "",
    address: "",
    sido: "",
    sigungu: "",
    dong: "",
    buildingName: "",
    weddingDate: "",
    weddingSido: "",
    weddingSigungu: "",
  },
};

const signupSlice = createSlice({
  name: "signup",
  initialState,
  reducers: {
    setDraft: (state, action: PayloadAction<Partial<SignupDraft>>) => {
      state.values = { ...state.values, ...action.payload };
    },
    resetDraft: (state) => {
      state.values = { ...initialState.values };
    },
  },
});

export const { setDraft, resetDraft } = signupSlice.actions;
export default signupSlice.reducer;

export const selectSignupValues = (state: { signup: SignupState }) =>
  state.signup.values;
