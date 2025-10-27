// src/pages/LoginClientPage.tsx
import { Link } from "react-router-dom";
import KakaoLoginButton from "../../components/social/kakaoLoginButton";

const LoginClientPage = () => {
  return (
    // 화면 크기와 무관하게 중앙에 390x844 프레임을 보여줌
    <div className="min-h-screen w-full flex items-center justify-center overflow-auto">
      {/* 모바일 프레임 390x844 */}
      <div className="relative w-[390px] h-[844px] bg-[#FF4646] overflow-hidden">
        {/* Ellipse 10 */}
        <div className="absolute w-[665px] h-[665px] left-[-138px] top-[-131px] bg-[#FFE3E7]/20 rounded-full" />
        {/* Ellipse 11 */}
        <div className="absolute w-[431px] h-[431px] left-[-21px] top-[546px] bg-[#FFE3E7]/20 rounded-full" />

        {/* 타이틀 */}
        <div className="absolute left-[32px] top-[124px] w-[225px] h-[66px] text-white font-bold text-[28px] leading-[33px]">
          <div>스드메, 한 번에</div>
          <div>비교하고 예약하세요</div>
        </div>

        {/* 로그인 버튼들 */}
        <div className="w-full max-w-xs space-y-4">
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
    </div>
  );
};

export default LoginClientPage;
