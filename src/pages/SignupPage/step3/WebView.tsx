// WebWeddingInfoView.tsx
import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

interface WebWeddingInfoViewProps {
  onBack?: () => void;
  onNext?: (payload: {
    hallName: string;
    province: string;
    district: string;
  }) => void;
  onSkip?: () => void;
}

/** 시/도 & 시/군/구 샘플 데이터 (필요 시 확장) */
const PROVINCES = ["서울특별시", "부산광역시", "경기도"] as const;

const DISTRICTS: Record<(typeof PROVINCES)[number], string[]> = {
  서울특별시: ["강남구", "서초구", "송파구", "마포구", "종로구"],
  부산광역시: ["해운대구", "수영구", "남구", "부산진구", "동래구"],
  경기도: ["성남시", "수원시", "용인시", "고양시", "부천시"],
};

export default function WebWeddingInfoView({
  onBack,
  onNext,
  onSkip,
}: WebWeddingInfoViewProps) {
  const [hallName, setHallName] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");

  const districtOptions = useMemo(
    () => (province ? DISTRICTS[province as keyof typeof DISTRICTS] ?? [] : []),
    [province]
  );

  const canNext = useMemo(
    () => Boolean(hallName.trim() && province && district),
    [hallName, province, district]
  );

  const handleNext = () => {
    if (!canNext) return;
    onNext?.({ hallName: hallName.trim(), province, district });
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col mt-20">
      {/* 상단 얇은 그라디언트 바 (주소 WebView와 동일 스타일) */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <main className="mx-auto max-w-6xl w-full px-4 md:px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* Left — Hero 카피 */}
        <section className="md:col-span-6 flex flex-col justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FF4646]/10 text-[#FF4646] text-xs font-semibold px-3 py-1 w-fit ring-1 ring-[#FF4646]/20">
            <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
            간편 회원가입
          </span>

          <h1 className="font-allimjang text-[44px] md:text-[56px] leading-[1.05] mt-3 tracking-[-0.02em]">
            <span className="text-[#FF4646]">예식 정보</span>를 입력해 주세요
          </h1>

          <p className="font-pretendard text-lg md:text-2xl text-gray-700 mt-4">
            예식장과 지역을 알려주시면{" "}
            <span className="font-semibold text-gray-900">맞춤 추천</span>에
            도움이 돼요.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            {[
              "예식장 이름 간단 입력",
              "시/도 선택 후 시/군/구 자동 활성화",
              "모바일·웹 동일 UX",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-[6px] h-2 w-2 rounded-full bg-[#FF4646]" />
                <span className="font-pretendard">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Right — Form 카드 (주소 WebView 카드 레이아웃 그대로) */}
        <section className="md:col-span-6 flex justify-center md:justify-end">
          <div className="relative w-full max-w-[520px]">
            {/* soft glow & offset */}
            <div className="absolute inset-0 -z-10 blur-xl rounded-3xl bg-gradient-to-br from-[#FF4646]/15 via-white to-[#111827]/5" />
            <div className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rounded-3xl bg-white" />

            <div className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur p-7 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              {/* 카드 헤더 */}
              <div className="flex items-center justify-between">
                <button
                  aria-label="back"
                  onClick={() => (onBack ? onBack() : history.back())}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5"
                >
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="w-6 h-6 text-[#1E2124]"
                  />
                </button>
                <h2 className="text-[20px] md:text-[22px] font-semibold tracking-[-0.2px]">
                  회원가입
                </h2>
                <div className="w-10" />
              </div>

              {/* 진행도 */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm text-[#1E2124]">
                  <span>3 / 3</span>
                  <span className="text-gray-500">예식 정보 입력</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-full bg-[#FF4646] rounded-full" />
                </div>
              </div>

              {/* 타이틀 */}
              <h3 className="mt-6 mb-6 text-[26px] md:text-[28px] leading-[38px] font-bold tracking-[-0.3px] text-[#1E2124]">
                예식 정보를
                <br />
                입력해 주세요
              </h3>

              {/* 폼 필드 */}
              <div className="space-y-4">
                {/* 예식장 이름 */}
                <div>
                  <label className="block text-[12px] text-[#666] mb-[6px]">
                    예식장 이름
                  </label>
                  <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white">
                    <input
                      value={hallName}
                      onChange={(e) => setHallName(e.target.value)}
                      placeholder="이름"
                      className="w-full h-full px-4 text-[14px] tracking-[-0.2px] text-[#111827] placeholder:text-[#9D9D9D] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 예식 지역 */}
                <div>
                  <label className="block text-[12px] text-[#666] mb-[6px]">
                    예식 지역
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* 시/도 */}
                    <div className="relative">
                      <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white px-4">
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
                      <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white px-4">
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
              </div>

              {/* 액션 바 */}
              <div className="mt-9 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canNext}
                  className={`w-full sm:w-[220px] h-[56px] rounded-[12px] text-white text-[16px] font-semibold transition-transform active:scale-[0.99] ${
                    canNext
                      ? "bg-[#FF4646] hover:brightness-95"
                      : "bg-[#D9D9D9] cursor-not-allowed"
                  }`}
                >
                  다음
                </button>

                <button
                  type="button"
                  onClick={onSkip}
                  className="w-full sm:w-[220px] h-[56px] rounded-[12px] text-[#999] text-[14px] font-semibold border border-transparent hover:border-gray-200"
                >
                  나중에 하기
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
