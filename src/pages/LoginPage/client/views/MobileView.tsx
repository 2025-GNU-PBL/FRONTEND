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

      // 화면에 맞게 배경 그룹(3요소)을 같은 비율로 확장
      const newScale = Math.max(vw / DESIGN_WIDTH, vh / DESIGN_HEIGHT);
      setScale(newScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#FF4646] overflow-hidden">
      {/* 디자인 기준 프레임 */}
      <div
        className="relative"
        style={{
          width: `${DESIGN_WIDTH}px`,
          height: `${DESIGN_HEIGHT}px`,
        }}
      >
        {/* === 배경 3요소 그룹: 동일 스케일 적용 === */}
        <div
          className="absolute inset-0 origin-center"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Ellipse 10 - 상단 큰 원 */}
          <div className="absolute w-[665px] h-[665px] left-[-138px] top-[-131px] bg-[#FFE3E7]/20 rounded-full" />
          {/* Ellipse 11 - 하단 작은 원 */}
          <div className="absolute w-[431px] h-[431px] left-[-21px] top-[546px] bg-[#FFE3E7]/20 rounded-full" />
          {/* 하단 그라데이션 */}
          <div className="absolute left-0 top-[461px] w-[390px] h-[173px] [background:linear-gradient(180deg,rgba(255,70,70,0)_0%,#FF4646_37.5%,#FF4646_50%,rgba(255,70,70,0.1)_100%)]" />
        </div>

        {/* === 콘텐츠 레이어 === */}
        <div className="relative z-10 flex flex-col justify-between h-full px-5 pt-[124px] pb-[74px]">
          {/* 상단 타이틀 & 서브 문구 */}
          <div className="text-left text-white">
            <h2 className="font-pretendard font-bold text-[28px] leading-[33px]">
              스드메, 한 번에
            </h2>
            <h2 className="font-pretendard font-bold text-[28px] leading-[33px]">
              비교하고 예약하세요
            </h2>
            <p className="mt-4 font-pretendard text-[16px] leading-[26px] tracking-[-0.2px]">
              비교·예약·상담까지 웨딩픽으로 간편하게
            </p>
          </div>

          {/* 하단 버튼 스택 (예시 코드와 동일한 구조/위치 느낌) */}
          <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
            <div className="w-full h-[56px]">
              <KakaoLoginButton role="CUSTOMER" />
            </div>
            <div className="w-full h-[56px]">
              <NaverLoginButton role="CUSTOMER" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
