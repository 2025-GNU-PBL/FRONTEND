import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom"; // useLocation 추가
import { kakaoLoginUser } from "../store/thunkFunctions"; // 이름 변경
import type { AppDispatch } from "../store";

const KakaoRedirectHandler: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation(); // useLocation 훅 사용

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (code) {
      dispatch(kakaoLoginUser({ code }))
        .unwrap()
        .then(() => {
          navigate("/"); // 로그인 성공 시 메인 페이지로 이동
        })
        .catch((error) => {
          console.error("Failed to log in with Kakao:", error);
          // 로그인 실패 시 로그인 페이지로 이동하여 사용자에게 재시도를 유도
          navigate("/login");
        });
    } else {
      console.error("Authorization code not found in URL.");
      // 코드가 없는 경우도 로그인 페이지로 이동
      navigate("/login");
    }
  }, [dispatch, navigate, location]);

  return <div>카카오 로그인 처리 중입니다...</div>;
};

export default KakaoRedirectHandler;
