import { useMemo, useState } from "react";
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

// 🔹 location.state 타입 정의 (any 사용 X)
interface OwnerSignUpLocationState {
  bzName?: string;
  bzNumber?: string;
  bankAccount?: string;
  [key: string]: unknown;
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

  // 🔹 any 제거: 정의한 인터페이스로 캐스팅
  const prevState = (location.state ?? {}) as OwnerSignUpLocationState;

  const isComplete = useMemo(
    () => Boolean(bzName && bzNumber && bankAccount),
    [bzName, bzNumber, bankAccount]
  );

  // ✅ 사업자번호 자동 하이픈(000-00-00000)
  const formatBizNumber = (value: string) => {
    const onlyNum = value.replace(/\D/g, "").slice(0, 10);

    if (onlyNum.length <= 3) {
      return onlyNum;
    } else if (onlyNum.length <= 5) {
      return `${onlyNum.slice(0, 3)}-${onlyNum.slice(3)}`;
    } else {
      return `${onlyNum.slice(0, 3)}-${onlyNum.slice(3, 5)}-${onlyNum.slice(
        5
      )}`;
    }
  };

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
    <div className="relative w-full min-h-screen bg-white overflow-hidden flex flex-col">
      {/* 헤더 */}
      <MyPageHeader title={title} onBack={onBack} showMenu={false} />

      {/* 본문 */}
      <div className="pt-[60px] flex-1 flex flex-col">
        <div className="flex-1 px-[20px]">
          <div className="mt-[24px] text-[14px] text-[#1E2124]">
            <span>3 /</span>
            &nbsp;
            <span className="text-[#999999]">3</span>
          </div>

          {/* 제목 */}
          <h1 className="mt-[8px] text-[24px] font-bold leading-[36px] -tracking-[0.3px] text-[#1E2124] mb-[24px] whitespace-pre-line">
            사업장 정보를{"\n"}입력해 주세요
          </h1>

          {/* 사업장명 */}
          <div className="mb-[24px]">
            <label className="block text-[#666666] text-[12px] leading-[18px] -tracking-[0.1px] mb-[6px]">
              사업장명
            </label>
            <div className="w-full h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-5">
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
            <div className="w-full h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-5">
              <input
                type="text"
                value={bzNumber}
                onChange={(e) => setBzNumber(formatBizNumber(e.target.value))}
                placeholder="000-00-00000"
                className="w-full h-full outline-none bg-transparent text-[14px] leading-[22px] -tracking-[0.2px] text-[#1E2124] placeholder:text-[#9D9D9D]"
              />
            </div>
          </div>

          {/* 계좌번호 */}
          <div className="mb-[32px]">
            <label className="block text-[#666666] text-[12px] leading-[18px] -tracking-[0.1px] mb-[6px]">
              계좌번호
            </label>
            <div className="w-full h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-5">
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="은행명 + 계좌번호"
                className="w-full h-full outline-none bg-transparent text-[14px] leading-[22px] -tracking-[0.2px] text-[#1E2124] placeholder:text-[#9D9D9D]"
              />
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="w-full px-[20px] pb-[20px] flex flex-col gap-[12px]">
          <button
            onClick={handleNext}
            disabled={!isComplete}
            className={`w-full h-[56px] rounded-[12px] text-[16px] font-semibold text-white flex items-center justify-center ${
              isComplete ? "bg-[#FF2233]" : "bg-[#D9D9D9] cursor-not-allowed"
            }`}
          >
            다음
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full h-[53px] rounded-[12px] text-[14px] font-semibold text-[#999999] flex items-center justify-center"
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
}
