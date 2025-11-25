import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useLocation, useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";

interface MobileWeddingInfoViewProps {
  onBack?: () => void;
  onNext?: (payload: {
    weddingDate: string;
    weddingSido: string;
    weddingSigungu: string;
  }) => void;
  onSkip?: () => void;
  title?: string;
}

// 라우터 state 타입 정의
interface ClientSignUpState {
  phone?: string;
  zipcode?: string;
  address?: string;
  detailAddress?: string;
  extraAddress?: string;
  weddingDate?: string;
  weddingSido?: string;
  weddingSigungu?: string;
}

const PROVINCES = ["서울특별시", "부산광역시", "인천광역시", "경기도"] as const;

const DISTRICTS: Record<(typeof PROVINCES)[number], string[]> = {
  서울특별시: ["강남구", "서초구", "송파구", "마포구", "종로구"],
  부산광역시: ["해운대구", "수영구", "남구", "부산진구", "동래구"],
  인천광역시: ["연수구", "남동구", "미추홀구", "부평구", "서구"],
  경기도: ["성남시", "수원시", "용인시", "고양시", "부천시"],
};

export default function MobileView({
  onBack,
  onNext,
  onSkip,
  title = "예식 정보",
}: MobileWeddingInfoViewProps) {
  const [weddingDate, setWeddingDate] = useState(""); // "YYYY-MM-DD"
  const [weddingSido, setWeddingSido] = useState("");
  const [weddingSigungu, setWeddingSigungu] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const prevState: ClientSignUpState =
    (location.state as ClientSignUpState) ?? {};

  const districtOptions = useMemo(
    () =>
      weddingSido ? DISTRICTS[weddingSido as keyof typeof DISTRICTS] ?? [] : [],
    [weddingSido]
  );

  const isComplete = useMemo(
    () => Boolean(weddingDate && weddingSido && weddingSigungu),
    [weddingDate, weddingSido, weddingSigungu]
  );

  const handleNext = () => {
    if (!isComplete) return;
    onNext?.({ weddingDate, weddingSido, weddingSigungu });

    navigate("/sign-up/client/step4", {
      state: {
        ...prevState,
        weddingDate,
        weddingSido,
        weddingSigungu,
      },
    });
  };

  const handleSkip = () => {
    onSkip?.();
    // [변경] 스킵 시에도 이전 상태는 유지해서 전달
    navigate("/sign-up/client/step4", {
      state: {
        ...prevState,
      },
    });
  };

  // 오늘 이전 날짜 선택 방지(선택 사항)
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const minDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
    today.getDate()
  )}`;

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      {/* 헤더 */}
      <MyPageHeader title={title} onBack={onBack} showMenu={false} />

      {/* 본문 */}
      <div className="flex-1 px-5 pt-15 pb-36">
        <div className="mt-[24px] text-[14px] text-[#1E2124]">
          <span>3 /</span>
          &nbsp;
          <span className="text-[#999999]">3</span>
        </div>

        <h1 className="mt-[8px] text-[24px] font-bold leading-[36px] -tracking-[0.3px] text-[#1E2124] mb-[24px] whitespace-pre-line">
          예식 정보를{"\n"}입력해 주세요
        </h1>

        {/* 예식일 */}
        <label className="block text-[#666] text-[12px] leading-[18px] -tracking-[0.1px] mb-[6px]">
          예식일
        </label>
        <div className="w-full h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-4 mb-[18px]">
          <input
            type="date"
            value={weddingDate}
            onChange={(e) => setWeddingDate(e.target.value)}
            min={minDate}
            placeholder="YYYY-MM-DD"
            className="w-full h-full outline-none text-[14px] placeholder:text-[#9D9D9D] bg-transparent"
          />
        </div>

        {/* 예식 지역 */}
        <label className="block text-[#666] text-[12px] leading-[18px] -tracking-[0.1px] mb-[6px]">
          예식 지역
        </label>
        <div className="grid grid-cols-2 gap-[10px]">
          {/* 시/도 */}
          <div className="relative">
            <div className="w-full h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-4">
              <select
                value={weddingSido}
                onChange={(e) => {
                  setWeddingSido(e.target.value);
                  setWeddingSigungu("");
                }}
                className="w-full h-full outline-none bg-transparent text-[14px] text-[#1E2124]"
              >
                <option value="">시/도</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <Icon
                icon="solar:alt-arrow-down-linear"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none"
              />
            </div>
          </div>

          {/* 시/군/구 */}
          <div className="relative">
            <div className="w-full h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-4">
              <select
                value={weddingSigungu}
                onChange={(e) => setWeddingSigungu(e.target.value)}
                disabled={!weddingSido}
                className="w-full h-full outline-none bg-transparent text-[14px] text-[#1E2124] disabled:text-[#9D9D9D]"
              >
                <option value="">
                  {weddingSido ? "시/군/구" : "시/도를 먼저 선택"}
                </option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <Icon
                icon="solar:alt-arrow-down-linear"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 영역 (고정) */}
      <div className="fixed inset-x-0 bottom-0 w-full px-5 pb-5 bg-white">
        <div className="flex flex-col gap-3">
          <button
            onClick={handleNext}
            disabled={!isComplete}
            className={`w-full h-[56px] rounded-[12px] text-white text-[16px] font-semibold ${
              isComplete ? "bg-[#FF2233]" : "bg-[#D9D9D9] cursor-not-allowed"
            }`}
          >
            다음
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full h-[56px] rounded-[12px] text-[#999] text-[14px] font-semibold"
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
}
