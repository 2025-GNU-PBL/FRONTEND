import { useEffect, useState } from "react";
import KakaoLoginButton from "../../../../components/social/kakaoLoginButton";
import NaverLoginButton from "../../../../components/social/NaverLoginButton";

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

const MobileView = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (typeof window === "undefined") return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // 화면 비율 맞춰 배경 그룹 전체를 같은 비율로 확대
      const newScale = Math.max(vw / DESIGN_WIDTH, vh / DESIGN_HEIGHT);
      setScale(newScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-white overflow-hidden">
      {/* === 디자인 기준 프레임 === */}
      <div
        className="relative"
        style={{
          width: `${DESIGN_WIDTH}px`,
          height: `${DESIGN_HEIGHT}px`,
        }}
      >
        {/* === 배경 3요소를 하나의 그룹으로 묶어서 같은 스케일로 확대 === */}
        <div
          className="absolute inset-0 origin-center"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* 큰 원 */}
          <div className="absolute w-[665px] h-[665px] left-[-138px] top-[-131px] bg-[#FFE3E7] rounded-full" />
          {/* 중간 그라데이션 */}
          <div className="absolute left-0 top-[466px] w-[390px] h-[208px] [background:linear-gradient(180deg,rgba(255,227,231,0)_-39.06%,#FFE3E7_38.54%,rgba(255,227,231,0)_116.15%)]" />
          {/* 작은 원 */}
          <div className="absolute w-[431px] h-[431px] left-[-21px] top-[546px] bg-[#FFE3E7] rounded-full" />
        </div>

        {/* === 콘텐츠 영역 === */}
        <div className="relative z-10 flex flex-col justify-between h-full px-5 pt-[100px] pb-[74px]">
          {/* 상단 타이틀/서브텍스트 */}
          <div className="text-left">
            <h2 className="font-pretendard font-bold text-[28px] leading-[33px] mb-[4px] text-black">
              웨딩픽과 비즈니스를
            </h2>
            <h2 className="font-pretendard font-bold text-[28px] leading-[33px] mb-[12px] text-black">
              성장시키세요
            </h2>
            <p className="font-pretendard text-[16px] leading-[26px] tracking-[-0.2px] text-[#33363D]">
              스드메 예약과 홍보, 이제 웨딩픽에서 해결하세요
            </p>
          </div>

          {/* 하단 소셜 로그인 버튼 (로그인 예시의 위치 기준으로 맞춤) */}
          <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
            <div className="w-full h-[56px]">
              <KakaoLoginButton role="OWNER" />
            </div>
            <div className="w-full h-[56px]">
              <NaverLoginButton role="OWNER" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
