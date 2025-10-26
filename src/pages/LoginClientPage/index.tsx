import { Link } from "react-router-dom";

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

        {/* 서브 문구 */}
        <p className="absolute left-[32px] top-[202px] w-[248px] h-[26px] text-white text-[16px] leading-[26px] tracking-[-0.2px]">
          비교·예약·상담까지 웨딩픽으로 간편하게
        </p>

        {/* 하단 그라데이션 */}
        <div className="absolute left-0 top-[461px] w-[390px] h-[173px] [background:linear-gradient(180deg,rgba(255,70,70,0)_0%,#FF4646_37.5%,#FF4646_50%,rgba(255,70,70,0.1)_100%)]" />

        {/* 카카오 버튼 */}
        <Link
          to="/log-in/client"
          className="absolute left-[20px] top-[646px] w-[350px] h-[56px] rounded-[50px] bg-[#FEE500] flex items-center justify-center gap-2 px-0 text-[#33363D]"
        >
          <img src="/images/kakao.png" alt="kakao" className="w-6 h-6" />
          <span className="font-semibold text-[16px] leading-[150%] tracking-[-0.2px]">
            카카오톡으로 시작하기
          </span>
        </Link>

        {/* 네이버 버튼 */}
        <Link
          to="/log-in/owner"
          className="absolute left-[20px] top-[714px] w-[350px] h-[56px] rounded-[50px] bg-[#03C75A] flex items-center justify-center gap-2 px-0 text-white"
        >
          <img src="/images/naver.png" alt="naver" className="w-6 h-6" />
          <span className="font-semibold text-[16px] leading-[150%] tracking-[-0.2px]">
            네이버로 시작하기
          </span>
        </Link>

        {/* Home Indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[390px] h-[34px]">
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[8px] w-[134px] h-[5px] bg-black rounded-[100px]" />
        </div>
      </div>
    </div>
  );
};

export default LoginClientPage;
