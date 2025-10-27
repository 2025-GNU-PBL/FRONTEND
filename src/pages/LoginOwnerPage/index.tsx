import { Link } from "react-router-dom";

const LoginOwnerPage = () => {
  return (
    // 어떤 화면에서도 390x844 프레임을 가운데 고정
    <div className="min-h-screen w-full flex items-center justify-center overflow-auto bg-white">
      {/* 모바일 프레임 */}
      <div className="relative w-[390px] h-[844px] bg-white overflow-hidden">
        {/* Ellipse 10 */}
        <div className="absolute w-[665px] h-[665px] left-[-138px] top-[-131px] bg-[#FFE3E7] rounded-full" />
        {/* Ellipse 11 */}
        <div className="absolute w-[431px] h-[431px] left-[-21px] top-[546px] bg-[#FFE3E7] rounded-full" />

        {/* 중앙 그라데이션(Rectangle 34626028) */}
        <div className="absolute left-0 top-[466px] w-[390px] h-[208px] [background:linear-gradient(180deg,rgba(255,227,231,0)_-39.06%,#FFE3E7_38.54%,rgba(255,227,231,0)_116.15%)]" />

        {/* 타이틀/서브텍스트 (피그마 레이아웃 기준) */}
        <div className="absolute left-[32px] top-[124px] text-black">
          <h2 className="font-pretendard font-bold text-[28px] leading-[33px] mb-[4px]">
            웨딩픽과 비즈니스를
          </h2>
          <h2 className="font-pretendard font-bold text-[28px] leading-[33px] mb-[12px]">
            성장시키세요
          </h2>
          <p className="font-pretendard text-[16px] leading-[26px] tracking-[-0.2px] text-[#33363D]">
            스드메 예약과 홍보, 이제 웨딩픽에서 해결하세요
          </p>
        </div>

        {/* 카카오 버튼 (Frame 2085665020) */}
        <Link
          to="/auth/kakao"
          className="absolute left-[20px] top-[646px] w-[350px] h-[56px] rounded-[50px] bg-[#FEE500] flex items-center justify-center gap-2 px-0"
        >
          <img src="/images/kakao.png" alt="kakao" className="w-6 h-6" />
          <span className="font-pretendard font-semibold text-[14px] leading-[150%] tracking-[-0.2px] text-[#33363D]">
            카카오톡으로 시작하기
          </span>
        </Link>

        {/* 네이버 버튼 (Frame 2085665021) */}
        <Link
          to="/auth/naver"
          className="absolute left-[20px] top-[714px] w-[350px] h-[56px] rounded-[50px] bg-[#03C75A] flex items-center justify-center gap-2 px-0"
        >
          <img src="/images/naver.png" alt="naver" className="w-6 h-6" />
          <span className="font-pretendard font-semibold text-[14px] leading-[150%] tracking-[-0.2px] text-white">
            네이버로 시작하기
          </span>
        </Link>

        {/* 하단 홈 인디케이터 */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[390px] h-[34px]">
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[8px] w-[134px] h-[5px] bg-black rounded-[100px]" />
        </div>
      </div>
    </div>
  );
};

export default LoginOwnerPage;
