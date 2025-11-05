import React from "react";
import { useNavigate } from "react-router-dom";
import signupImg from "../../../assets/images/signup.png";
interface MobileCompleteViewProps {
  /** 문구 커스터마이즈가 필요하면 넘겨주세요 */
  title?: string;
  descriptionLine1?: string;
  descriptionLine2?: string;
}

export default function MobileView({
  title = "환영합니다!",
  descriptionLine1 = "비교·예약·상담까지",
  descriptionLine2 = "웨딩픽으로 간편하게 해결하세요",
}: MobileCompleteViewProps) {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/");
  };

  return (
    <div className="relative w-[390px] h-[844px] bg-white overflow-hidden">
      {/* 본문 컨텐츠 */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[169px] w-[335px]">
        {/* 타이틀 */}
        <h1 className="mx-auto w-[237px] h-[36px] text-center text-[#1E2124] font-bold text-[24px] leading-[36px] tracking-[-0.3px]">
          {title}
        </h1>

        {/* 설명 */}
        <p className="absolute left-1/2 -translate-x-1/2 top-[72px] w-[199px] h-[52px] text-center text-[#666] text-[16px] leading-[26px] tracking-[-0.2px]">
          {descriptionLine1}
          <br />
          {descriptionLine2}
        </p>

        {/* 일러스트 이미지 */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[204px] w-[156px] h-[156px]"
          aria-hidden
        >
          <img
            src={signupImg}
            alt="가입 완료 일러스트"
            className="w-[156px] h-[156px] object-contain"
            draggable={false}
          />
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-[90px] w-[390px] px-[20px] z-50">
        <button
          type="button"
          onClick={handleStart}
          className="w-[350px] h-[56px] mx-auto rounded-[12px] bg-[#FF2233] text-white text-[16px] font-semibold active:scale-[0.99] transition"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
