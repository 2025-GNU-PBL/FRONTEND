// src/store/thunkFunctions.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import axiosInstance from "../utils/axios";

type RegisterBody = {
    name: string;
    email: string;
    password: string;
    role: number;
};

// 모든 API 호출에 공통적으로 사용할 axios 인스턴스를 통일
// registerUser도 axiosInstance 사용
export const registerUser = createAsyncThunk(
    "user/registerUser",
    async (body: RegisterBody, thunkAPI) => {
        try {
            // axiosInstance 사용으로 변경
            const response = await axiosInstance.post("/api/users/register", body);
            return response.data;
        } catch (error) {
            // 에러 핸들링 로직 통일
            if (isAxiosError(error)) {
                console.error("Axios Error:", error);
                // `error.response?.data`를 사용해 백엔드에서 보낸 에러 메시지를 우선적으로 반환
                return thunkAPI.rejectWithValue(error.response?.data || error.message);
            }
            console.error("Unexpected Error:", error);
            return thunkAPI.rejectWithValue('An unexpected error occurred');
        }
    }
);

type SocialLoginPayload = {
    code: string;
};

// 카카오 소셜 로그인
export const kakaoLoginUser = createAsyncThunk(
    'user/kakaoLoginUser',
    async (body: SocialLoginPayload, thunkAPI) => {
        try {
            const response = await axiosInstance.post('/api/auth/kakao', body);
            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                return thunkAPI.rejectWithValue(error.response?.data || '카카오 로그인 실패');
            }
            return thunkAPI.rejectWithValue('카카오 로그인 실패');
        }
    }
);

// 네이버 소셜 로그인
export const naverLoginUser = createAsyncThunk(
    'user/naverLoginUser',
    async (payload, thunkAPI) => {
        try {
            const response = await axiosInstance.post('/api/auth/naver', payload);
            return response.data;
        } catch (error) {
            if (isAxiosError(error)) {
                return thunkAPI.rejectWithValue(error.response?.data || '네이버 로그인 실패');
            }
            return thunkAPI.rejectWithValue('네이버 로그인 실패');
        }
    }
);

// ⭐️ 로그아웃 Thunk 함수를 새로 정의
export const logoutUser = createAsyncThunk(
    "user/logoutUser",
    async (_, thunkAPI) => {
      try {
        // 백엔드 로그아웃 API 호출
        // axiosInstance를 사용하여 Authorization 헤더를 자동으로 포함
        const response = await axiosInstance.post("/api/auth/logout");
  
        // 로그아웃 성공 시 서버 응답 데이터 반환
        return response.data;
      } catch (error) {
        if (isAxiosError(error)) {
          console.error("Logout failed:", error);
          // 에러 발생 시 에러 메시지를 반환
          return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
        console.error("An unexpected error occurred during logout:", error);
        return thunkAPI.rejectWithValue('An unexpected error occurred');
      }
    }
  );