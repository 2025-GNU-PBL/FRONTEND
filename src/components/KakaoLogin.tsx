// src/components/KakaoLogin.tsx

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../store";
import KakaoImage from "../assets/images/kakao_login_large_narrow.png";
import { logoutUser } from "../store/thunkFunctions";

const KAKAO_JAVASCRIPT_KEY = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

// ⭐️ Kakao 객체에 대한 타입 정의
interface KakaoAuth {
  authorize: (options: { redirectUri: string }) => void;
  logout: (callback: () => void) => void;
  getAccessToken: () => string | null;
}

interface KakaoSDK {
  isInitialized: () => boolean;
  init: (appKey: string) => void;
  Auth: KakaoAuth;
}

declare global {
  // ⭐️ any 대신 정의한 타입 사용
  interface Window {
    Kakao: any;
  }
}

const KakaoLogin: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state: RootState) => state.user.isAuth);
  const userData = useSelector((state: RootState) => state.user.userData);

  useEffect(() => {
    if (!window.Kakao) {
      const script = document.createElement("script");
      script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.8/kakao.min.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
        }
      };
    } else if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
    }
  }, []);

  const loginWithKakao = () => {
    if (window.Kakao && !isLoggedIn) {
      window.Kakao.Auth.authorize({
        redirectUri: KAKAO_REDIRECT_URI,
      });
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        if (window.Kakao.Auth.getAccessToken()) {
          window.Kakao.Auth.logout(() => {
            navigate("/login");
          });
        } else {
          navigate("/login");
        }
      })
      .catch((error) => {
        console.error("로그아웃 실패:", error);
        navigate("/login");
      });
  };

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <h2>안녕하세요, {userData.name}님! 👋</h2>
          <p>카카오 로그인이 완료되었습니다.</p>
          <button onClick={handleLogout}>로그아웃</button>
        </div>
      ) : (
        <a id="kakao-login-btn" onClick={loginWithKakao}>
          <img src={KakaoImage} width="222" alt="카카오 로그인 버튼" />
        </a>
      )}
    </div>
  );
};

export default KakaoLogin;
