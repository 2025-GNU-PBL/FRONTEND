import KakaoLoginButton from "../../components/social/kakaoLoginButton";
import NaverLoginButton from "../../components/social/NaverLoginButton";

const LoginClientPage = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-auto">
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

        {/* 서브 문구 */}
        <p className="absolute left-[32px] top-[202px] w-[248px] h-[26px] text-white text-[16px] leading-[26px] tracking-[-0.2px]">
          비교·예약·상담까지 웨딩픽으로 간편하게
        </p>

        {/* 하단 그라데이션 */}
        <div className="absolute left-0 top-[461px] w-[390px] h-[173px] [background:linear-gradient(180deg,rgba(255,70,70,0)_0%,#FF4646_37.5%,#FF4646_50%,rgba(255,70,70,0.1)_100%)]" />

        {/* 하단 버튼 스택*/}
        <div className="absolute left-[20px] right-[20px] bottom-[60px] flex flex-col gap-4">
          <div className="w-full h-[56px]">
            <KakaoLoginButton role="CUSTOMER" />
          </div>
          <div className="w-full h-[56px]">
            <NaverLoginButton role="CUSTOMER" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginClientPage;
