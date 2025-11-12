import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";

interface MobileBusinessInfoViewProps {
  onBack?: () => void;
  onNext?: (payload: {
    bzName: string;
    bzNumber: string;
    bankAccount: string;
  }) => void;
  onSkip?: () => void;
  title?: string;
}

export default function MobileView({
  onBack,
  onNext,
  onSkip,
  title = "",
}: MobileBusinessInfoViewProps) {
  const [bzName, setBzName] = useState("");
  const [bzNumber, setBzNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const prevState = (location.state as any) || {};

  const isComplete = useMemo(
    () => Boolean(bzName && bzNumber && bankAccount),
    [bzName, bzNumber, bankAccount]
  );

  const handleNext = () => {
    if (!isComplete) return;

    onNext?.({
      bzName,
      bzNumber,
      bankAccount,
    });

    navigate("/sign-up/owner/step4", {
      state: {
        ...prevState,
        bzName,
        bzNumber,
        bankAccount,
      },
    });
  };

  const handleSkip = () => {
    onSkip?.();
    navigate("/sign-up/owner/step4", {
      state: {
        ...prevState,
      },
    });
  };

  return (
    <div className="relative w-[390px] h-[844px] bg-white overflow-hidden">
      {/* 헤더 */}
      <MyPageHeader title={title} onBack={onBack} showMenu={false} />

      {/* 본문 */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[143px] w-[350px]">
        {/* 3 / 3 */}
        <div className="w-[29px] h-[22px] text-[14px] leading-[22px] -tracking-[0.2px] text-[#1E2124] mb-[4px]">
          3 / 3
        </div>

        {/* 제목 */}
        <h1 className="w-[237px] h-[72px] text-[24px] font-bold leading-[36px] -tracking-[0.3px] text-[#1E2124] mb-[24px] whitespace-pre-line">
          사업장 정보를{"\n"}입력해 주세요
        </h1>

        {/* 사업장명 */}
        <div className="mb-[24px]">
          <label className="block text-[#666666] text-[12px] leading-[18px] -tracking-[0.1px] mb-[6px]">
            사업장명
          </label>
          <div className="w-[350px] h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-5">
            <input
              type="text"
              value={bzName}
              onChange={(e) => setBzName(e.target.value)}
              placeholder="사업장 명"
              className="w-full h-full outline-none bg-transparent text-[14px] leading-[22px] -tracking-[0.2px] text-[#1E2124] placeholder:text-[#9D9D9D]"
            />
          </div>
        </div>

        {/* 사업자 번호 */}
        <div className="mb-[24px]">
          <label className="block text-[#666666] text-[12px] leading-[18px] -tracking-[0.1px] mb-[6px]">
            사업자 번호
          </label>
          <div className="w-[350px] h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-5">
            <input
              type="text"
              value={bzNumber}
              onChange={(e) => setBzNumber(e.target.value)}
              placeholder="1215-4548-4554"
              className="w-full h-full outline-none bg-transparent text-[14px] leading-[22px] -tracking-[0.2px] text-[#1E2124] placeholder:text-[#9D9D9D]"
            />
          </div>
        </div>

        {/* 계좌번호 */}
        <div className="mb-[32px]">
          <label className="block text-[#666666] text-[12px] leading-[18px] -tracking-[0.1px] mb-[6px]">
            계좌번호
          </label>
          <div className="w-[350px] h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-5">
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="1215-4548-4554"
              className="w-full h-full outline-none bg-transparent text-[14px] leading-[22px] -tracking-[0.2px] text-[#1E2124] placeholder:text-[#9D9D9D]"
            />
          </div>
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[80px] w-[350px] flex flex-col gap-[12px]">
        <button
          onClick={handleNext}
          disabled={!isComplete}
          className={`w-[350px] h-[56px] rounded-[12px] text-[16px] font-semibold text-white flex items-center justify-center ${
            isComplete ? "bg-[#FF2233]" : "bg-[#D9D9D9] cursor-not-allowed"
          }`}
        >
          다음
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="w-[350px] h-[53px] rounded-[12px] text-[14px] font-semibold text-[#999999] flex items-center justify-center"
        >
          나중에 하기
        </button>
      </div>
    </div>
  );
}
