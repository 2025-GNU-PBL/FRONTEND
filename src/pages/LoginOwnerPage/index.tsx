// src/pages/LoginClientPage.tsx
import { Link } from "react-router-dom";

const LoginClientPage = () => {
  return (
    <div>
      {/* mobile */}
      <div
        className="relative min-h-screen flex flex-col items-center px-4 md:hidden overflow-hidden"
        style={{ background: "#FFE3E7" }}
      >
        {/* === 배경 데코레이션 === */}
        {/* Ellipse 10 (맨 위, 가장 큼) */}
        <div
          className="absolute rounded-full pointer-events-none z-0"
          style={{
            width: "665px",
            height: "665px",
            left: "-138px",
            top: "-131px",
            background: "#FFE3E7",
          }}
        />

        {/* Rectangle 34626028 (중간, 그라데이션 레이어) */}
        {/* 📌 디자이너 원본 그라데이션은 배경색(#FFE3E7)과 같아서 사실상 보이지 않을 수 있습니다.
            아래 'VISIBLE' 버전을 기본으로 두고, 정말 원본이 필요하면 'ORIGINAL' 쪽 주석을 해제하세요. */}
        {/* ORIGINAL (안 보일 수 있음)
        <div
          className="absolute pointer-events-none z-10"
          style={{
            width: "390px",
            height: "208px",
            left: "0px",
            top: "466px",
            background:
              "linear-gradient(180deg, rgba(255, 227, 231, 0) -39.06%, #FFE3E7 38.54%, rgba(255, 227, 231, 0) 116.15%)",
          }}
        />
        */}

        {/* VISIBLE (눈에 띄게 보정) */}
        <div
          className="absolute pointer-events-none z-10"
          style={{
            width: "390px",
            height: "208px",
            left: "0px",
            top: "466px",
            // 조금 더 진한 핑크로 오버레이 + 살짝 블렌드
            background:
              "linear-gradient(180deg, rgba(255,180,190,0) 0%, rgba(255,180,190,0.9) 50%, rgba(255,180,190,0) 100%)",
            mixBlendMode: "multiply",
          }}
        />

        {/* Ellipse 11 (맨 아래, 중간 크기) */}
        <div
          className="absolute rounded-full pointer-events-none z-0"
          style={{
            width: "431px",
            height: "431px",
            left: "-21px",
            top: "546px",
            background: "#FFE3E7",
          }}
        />

        {/* === 로그인 헤더 텍스트 === */}
        <div className="flex flex-col mb-[400px] mt-[130px] items-start text-black -ml-8 relative z-20">
          <h2 className="font-bold text-[28px] -mb-2">웨딩픽과 비즈니스를</h2>
          <h2 className="font-bold text-[28px] mb-3">성장시키세요</h2>
          <h3>스드메 예약과 홍보, 이제 웨딩픽에서 해결하세요</h3>
        </div>

        {/* === 로그인 버튼들 === */}
        <div className="w-full max-w-xs space-y-4 relative z-20">
          <Link
            to="/log-in/client"
            className="w-full flex items-center justify-center space-x-3 py-3.5 rounded-[50px] bg-[#FEE500] text-[#4a4a4a] font-semibold"
          >
            <img src="/images/kakao.png" alt="카카오" className="h-[24px]" />
            <span className="font-semibold">카카오톡으로 시작하기</span>
          </Link>

          <Link
            to="/log-in/owner"
            className="w-full flex items-center justify-center space-x-3 py-3.5 rounded-[50px] text-white font-semibold bg-[#03C75A]"
          >
            <img src="/images/naver.png" alt="네이버" className="h-[24px]" />
            <span className="font-semibold">네이버로 시작하기</span>
          </Link>
        </div>
      </div>

      {/* web (추후 데스크톱 대응용) */}
      <div className="hidden md:block"></div>
    </div>
  );
};

export default LoginClientPage;
