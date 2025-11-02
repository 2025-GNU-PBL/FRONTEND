import { Link } from "react-router-dom";

// ✅ Mobile-First 반응형 뷰
const MobileView = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F6F7FB]">
      {/* 배경 이미지 레이어 */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{ backgroundImage: "url(/images/login-bg.png)" }}
        aria-hidden
      />

      {/* 컨텐츠 레이어
        - ❗ py-10 (상하 40px) -> pt-10 (상 40px), pb-[74px] (하 74px)로 수정
      */}
      <div className="relative z-10 flex flex-col justify-between min-h-screen w-full px-5 pt-10 pb-[74px]">
        {/* === 상단 컨텐츠 (로고) === */}
        <div className="flex flex-col items-center pt-[90px] md:pt-20">
          {/* 문구: 1만 신부님의 선택 */}
          <div className="text-center">
            <span className="font-pretendard font-semibold text-[16px] leading-[21px] tracking-[-0.32px] md:text-lg">
              1만 신부님의 선택
            </span>
          </div>

          {/* 로고: 웨딩PICK */}
          <h1 className="mt-2 font-allimjang font-[700] text-[50px] leading-[60px] text-[#FF2233] select-none md:text-6xl">
            웨딩PICK
          </h1>
        </div>

        {/* === 하단 컨텐츠 (버튼) === */}
        <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
          {/* 고객 로그인 버튼 */}
          <Link
            to="/log-in/client"
            className="w-full h-14 rounded-[50px] bg-[#FF2233] flex items-center justify-center"
          >
            <span className="font-pretendard font-semibold text-[16px] md:text-lg text-white">
              고객 로그인
            </span>
          </Link>

          {/* 사장님 로그인 버튼 */}
          <Link
            to="/log-in/owner"
            className="w-full h-14 rounded-[50px] bg-white border border-[#FF2233] flex items-center justify-center"
          >
            <span className="text-[#FF2233] font-semibold text-[16px] md:text-lg leading-[150%] tracking-[-0.2px]">
              사장님 로그인
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
