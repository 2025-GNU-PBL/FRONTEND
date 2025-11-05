import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../components/MyPageHeader";

interface MobileWeddingInfoViewProps {
  onBack?: () => void;
  onNext?: (payload: {
    hallName: string;
    province: string;
    district: string;
  }) => void;
  onSkip?: () => void;
  title?: string;
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
  const [hallName, setHallName] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");

  const navigate = useNavigate();

  const districtOptions = useMemo(
    () => (province ? DISTRICTS[province as keyof typeof DISTRICTS] ?? [] : []),
    [province]
  );

  const isComplete = useMemo(
    () => Boolean(hallName.trim() && province && district),
    [hallName, province, district]
  );

  const handleNext = () => {
    if (!isComplete) return;
    onNext?.({ hallName: hallName.trim(), province, district });
    navigate("/sign-up/step4");
  };

  const handleSkip = () => {
    onSkip?.();
    navigate("/sign-up/step4");
  };

  return (
    <div className="relative w-[390px] h-[844px] bg-white overflow-hidden">
      {/* 헤더 */}
      <MyPageHeader title={title} onBack={onBack} showMenu={false} />

      {/* 본문 */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[143px] w-[350px] pb-[140px]">
        {/* ↑ 스크롤 시 버튼 영역과 겹치지 않게 여유 하단패딩 추가 */}
        <div className="text-[14px] leading-[22px] -tracking-[0.2px] text-[#1E2124] mb-[8px]">
          3 / 3
        </div>

        <h1 className="text-[24px] font-bold leading-[36px] -tracking-[0.3px] text-[#1E2124] mb-[24px]">
          예식 정보를{"\n"}입력해 주세요
        </h1>

        {/* 예식장 이름 */}
        <label className="block text-[#666] text-[12px] leading-[18px] -tracking-[0.1px] mb-[6px]">
          예식장 이름
        </label>
        <div className="w-[350px] h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-4 mb-[18px]">
          <input
            value={hallName}
            onChange={(e) => setHallName(e.target.value)}
            placeholder="이름"
            className="w-full h-full outline-none text-[14px] placeholder:text-[#9D9D9D]"
          />
        </div>

        {/* 예식 지역 */}
        <label className="block text-[#666] text-[12px] leading-[18px] -tracking-[0.1px] mb-[6px]">
          예식 지역
        </label>
        <div className="grid grid-cols-2 gap-[10px]">
          {/* 시/도 */}
          <div className="relative">
            <div className="w-[170px] h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-4">
              <select
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setDistrict("");
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
            <div className="w-[170px] h-[54px] border border-[#E8E8E8] rounded-[10px] flex items-center px-4">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!province}
                className="w-full h-full outline-none bg-transparent text-[14px] text-[#1E2124] disabled:text-[#9D9D9D]"
              >
                <option value="">
                  {province ? "시/군/구" : "시/도를 먼저 선택"}
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

      {/* 하단 버튼 영역 */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-[80px] w-[390px] px-[20px] pb-[8px] z-50 pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-3 py-3">
          <button
            onClick={handleNext}
            disabled={!isComplete}
            className={`w-[350px] h-[56px] mx-auto rounded-[12px] text-white text-[16px] font-semibold ${
              isComplete ? "bg-[#FF2233]" : "bg-[#D9D9D9] cursor-not-allowed"
            }`}
          >
            다음
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-[350px] h-[53px] mx-auto rounded-[12px] text-[#999] text-[14px] font-semibold"
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
}
