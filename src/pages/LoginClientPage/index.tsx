// src/pages/LoginClientPage.tsx
import { Link } from "react-router-dom";

const LoginClientPage = () => {
  return (
    <div>
      {/* mobile */}
      <div className="relative min-h-screen flex flex-col items-center bg-[#ff6566] px-4 md:hidden overflow-hidden">
        {/* Ellipse 10 (맨 위 큰 원) */}
        <div
          className="absolute rounded-full"
          style={{
            width: "665px",
            height: "665px",
            left: "-138px",
            top: "-131px",
            background: "#FFE3E7",
            opacity: 0.2,
          }}
        />

        {/* Ellipse 11 (맨 아래 중간 원) */}
        <div
          className="absolute rounded-full"
          style={{
            width: "431px",
            height: "431px",
            left: "-21px",
            top: "546px",
            background: "#FFE3E7",
            opacity: 0.2,
          }}
        />

        {/* Subtract (두 원의 중간 영역만 보이게) */}
        <div
          className="absolute"
          style={{
            width: "390px",
            height: "173px",
            left: "0px",
            top: "461px",
            background:
              "linear-gradient(180deg, rgba(255,70,70,0) 0%, #FF4646 37.5%, #FF4646 50%, rgba(255,70,70,0.1) 100%)",
            maskImage:
              "radial-gradient(circle at 200px -100px, transparent 300px, black 310px), radial-gradient(circle at 200px 600px, transparent 240px, black 250px)",
            WebkitMaskComposite: "destination-out",
            maskComposite: "exclude",
          }}
        />

        {/* 로고 */}
        <div className="flex flex-col mb-[400px] mt-[130px] items-start text-white -ml-15 relative z-10">
          <h2 className="font-bold text-[28px] -mb-2">스드메, 한 번에</h2>
          <h2 className="font-bold text-[28px] mb-3">비교하고 예약하세요</h2>
          <h3>비교·예약·상담까지 웨딩픽으로 간편하게</h3>
        </div>

        {/* 로그인 버튼들 */}
        <div className="w-full max-w-xs space-y-4 relative z-10">
          <Link
            to="/log-in/client"
            className="w-full flex items-center justify-center space-x-3 py-3.5 rounded-[50px] bg-[#FEE500] text-[#4a4a4a] font-semibold"
          >
            <img src="/images/kakao.png" alt="Sample" className="h-[24px]" />
            <span className="font-semibold">카카오톡으로 시작하기</span>
          </Link>

          <Link
            to="/log-in/owner"
            className="w-full flex items-center justify-center space-x-3 py-3.5 rounded-[50px] text-white font-semibold bg-[#03C75A]"
          >
            <img src="/images/naver.png" alt="Sample" className="h-[24px]" />
            &nbsp; 네이버로 시작하기
          </Link>
        </div>
      </div>

      {/* web */}
      <div></div>
    </div>
  );
};

export default LoginClientPage;
