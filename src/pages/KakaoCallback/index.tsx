// src/pages/KakaoCallback.tsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const KakaoCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (code) {
      // 액세스 토큰 요청
      fetchAccessToken(code);
    } else {
      // code가 없으면 로그인 실패
      console.error("카카오 로그인 실패: code가 없습니다.");
      navigate("/"); // 홈으로 리다이렉트
    }
  }, [location, navigate]);

  const fetchAccessToken = async (code: string) => {
    try {
      // 카카오 토큰 요청 API 호출
      const response = await fetch("https://kauth.kakao.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: "YOUR_REST_API_KEY", // REST API 키
          redirect_uri: "http://localhost:3000/oauth/kakao/callback", // 1단계에서 설정한 URI
          code: code,
        }).toString(),
      });

      const data = await response.json();
      console.log("액세스 토큰:", data.access_token);

      // 액세스 토큰을 로컬 스토리지에 저장하거나 전역 상태 관리
      localStorage.setItem("kakao_access_token", data.access_token);

      // 사용자 정보 가져오기 API 호출
      const userInfoResponse = await fetch(
        "https://kapi.kakao.com/v2/user/me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      );

      const userInfo = await userInfoResponse.json();
      console.log("사용자 정보:", userInfo);

      // 로그인 성공 후 메인 페이지로 이동
      navigate("/main");
    } catch (error) {
      console.error("액세스 토큰 또는 사용자 정보 요청 실패:", error);
    }
  };

  return <div>로그인 중...</div>;
};

export default KakaoCallback;
