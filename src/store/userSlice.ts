import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  kakaoLoginUser,
  naverLoginUser,
  registerUser,
  logoutUser,
  authUser,
} from "./thunkFunctions";
import { toast } from "react-toastify";

export type UserRole = "CUSTOMER" | "OWNER";

export type UserData = {
  id: string;
  email: string;
  name: string;
  role: UserRole | number;
  image?: string;
  accessToken?: string;
};

type UserState = {
  userData: UserData | null;
  isAuth: boolean;
  isLoading: boolean;
  error: string | null;
};

const initialState: UserState = {
  userData: null,
  isAuth: false,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    forceLogout(state) {
      state.isAuth = false;
      state.userData = null;
      state.error = null;
      localStorage.removeItem("accessToken");
      toast.info("로그아웃 되었습니다.");
    },
  },
  extraReducers: (builder) => {
    // 회원가입
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

    // 카카오 로그인
    builder.addCase(kakaoLoginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      kakaoLoginUser.fulfilled,
      (state, action: PayloadAction<UserData>) => {
        state.isLoading = false;
        state.userData = action.payload;
        state.isAuth = true;
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
          : "An unknown error occurred";
      state.error = errorMessage;
      toast.error(errorMessage);
    });

    // 네이버 로그인
    builder.addCase(naverLoginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      naverLoginUser.fulfilled,
      (state, action: PayloadAction<UserData>) => {
        state.isLoading = false;
        state.userData = action.payload;
        state.isAuth = true;
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
          : "An unknown error occurred";
      state.error = errorMessage;
      toast.error(errorMessage);
    });

    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isAuth = false;
      state.userData = null;
      state.error = null;
      localStorage.removeItem("accessToken");
      toast.info("로그아웃 되었습니다.");
    });

    // ❌ 더 이상 rejected에서 에러 토스트를 띄우지 않습니다.
    builder.addCase(logoutUser.rejected, (state) => {
      // 혹시 모를 예상치 못한 상황 대비: 그래도 클라 로그아웃 처리
      state.isAuth = false;
      state.userData = null;
      state.error = null;
      localStorage.removeItem("accessToken");
      // 토스트 없음 (조용히 처리)
    });

    // ✅ 인증 유저 조회
    builder.addCase(authUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      authUser.fulfilled,
      (state, action: PayloadAction<UserData>) => {
        state.isLoading = false;
        state.userData = action.payload;
        state.isAuth = true;
        // 서버가 새 accessToken을 내려주는 경우에 대비
        if (action.payload?.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
      }
    );
    builder.addCase(authUser.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuth = false;
      state.userData = null;
      const errorMessage =
        typeof action.payload === "string"
          ? action.payload
          : "인증 정보 확인 실패";
      state.error = errorMessage;
      // 메시지는 조용히 처리(토스트 원치 않으면 주석 유지)
      // toast.error(errorMessage);
    });
  },
});

export const { forceLogout } = userSlice.actions;
export default userSlice.reducer;
