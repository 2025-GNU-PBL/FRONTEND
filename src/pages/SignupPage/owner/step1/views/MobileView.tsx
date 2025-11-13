import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";

export default function MobileView() {
  const [phoneNumber, setphoneNumber] = useState("");
  const nav = useNavigate();

  // 다음 단계로 이동하는 핸들러
  const handleNext = () => {
    if (!phoneNumber) return;
    nav("/sign-up/owner/step2", {
      state: { phoneNumber },
    });
  };

  return (
    <div className="w-full bg-white">
      {/* 프레임 하나로 통일 (헤더 + 본문) */}
      <div className="mx-auto w-[390px] h-[844px] bg-[#F6F7FB] flex flex-col">
        <div className="relative w-[390px] h-[844px] bg-white mx-auto overflow-hidden">
          <div className="sticky top-0 z-20 bg-[#F6F7FB] border-b border-gray-200">
            <MyPageHeader title="" onBack={() => nav(-1)} showMenu={false} />
          </div>

          {/* Step Progress */}
          <div className="absolute left-[21px] top-[143px] text-[14px] text-[#1E2124]">
            1 / 3
          </div>

          {/* Title */}
          <div className="absolute left-[20px] top-[169px] w-[335px] text-[24px] font-bold text-[#1E2124] leading-[36px]">
            전화번호를
            <br />
            입력해 주세요
          </div>

          {/* Label */}
          <div className="absolute left-[20px] top-[265px] text-[12px] text-[#666]">
            전화번호
          </div>

          {/* Input */}
          <div className="absolute left-[20px] top-[291px] w-[350px] h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-4">
            <input
              type="tel"
              placeholder="010-1234-5678"
              value={phoneNumber}
              onChange={(e) => setphoneNumber(e.target.value)}
              className="w-full text-[14px] text-[#1E2124] placeholder:text-[#9D9D9D] focus:outline-none"
            />
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            disabled={!phoneNumber}
            className={`absolute left-[20px] top-[700px] w-[350px] h-[56px] rounded-[12px] font-semibold text-[16px] text-white transition
              ${
                phoneNumber ? "bg-[#FF0000]" : "bg-[#D9D9D9] cursor-not-allowed"
              }`}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
