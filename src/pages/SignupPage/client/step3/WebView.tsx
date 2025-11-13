// src/pages/SignupPage/step3/WebView.tsx
import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

interface WebWeddingInfoViewProps {
  onBack?: () => void;
  onNext?: (payload: {
    weddingDate: string;
    weddingSido: string;
    weddingSigungu: string;
  }) => void;
  onSkip?: () => void;
}

const PROVINCES = ["서울특별시", "부산광역시", "인천광역시", "경기도"] as const;

const DISTRICTS: Record<(typeof PROVINCES)[number], string[]> = {
  서울특별시: ["강남구", "서초구", "송파구", "마포구", "종로구"],
  부산광역시: ["해운대구", "수영구", "남구", "부산진구", "동래구"],
  인천광역시: ["연수구", "남동구", "미추홀구", "부평구", "서구"],
  경기도: ["성남시", "수원시", "용인시", "고양시", "부천시"],
};

export default function WebView({
  onBack,
  onNext,
  onSkip,
}: WebWeddingInfoViewProps) {
  const nav = useNavigate();
  const location = useLocation();
  const prevState = (location.state as any) || {};

  const [weddingDate, setWeddingDate] = useState("");
  const [weddingSido, setWeddingSido] = useState("");
  const [weddingSigungu, setWeddingSigungu] = useState("");

  const districtOptions = useMemo(
    () =>
      weddingSido ? DISTRICTS[weddingSido as keyof typeof DISTRICTS] ?? [] : [],
    [weddingSido]
  );

  const isComplete = useMemo(
    () => Boolean(weddingDate && weddingSido && weddingSigungu),
    [weddingDate, weddingSido, weddingSigungu]
  );

  // 오늘 이전 선택 방지
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const minDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
    today.getDate()
  )}`;

  const handleNext = useCallback(() => {
    if (!isComplete) return;

    const payload = { weddingDate, weddingSido, weddingSigungu };
    onNext?.(payload);

    nav("/sign-up/client/step4", {
      state: {
        ...prevState,
        ...payload,
      },
    });
  }, [
    isComplete,
    weddingDate,
    weddingSido,
    weddingSigungu,
    nav,
    prevState,
    onNext,
  ]);

  const handleSkip = useCallback(() => {
    onSkip?.();
    // 기존 state만 넘기고 예식 정보는 선택 사항
    nav("/sign-up/client/step4", {
      state: {
        ...prevState,
      },
    });
  }, [nav, prevState, onSkip]);

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col mt-20">
      {/* 상단 그라디언트 바 */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <main className="mx-auto max-w-6xl w-full px-4 md:px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* Left — 카피 영역 */}
        <section className="md:col-span-6 flex flex-col justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FF4646]/10 text-[#FF4646] text-xs font-semibold px-3 py-1 w-fit ring-1 ring-[#FF4646]/20">
            <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
            예식 정보 입력 (선택)
          </span>

          <h1 className="font-allimjang text-[44px] md:text-[56px] leading-[1.05] mt-3 tracking-[-0.02em] whitespace-pre-line">
            <span className="text-[#FF4646]">예식일과 지역</span>을 알려주시면
            {"\n"}더 정확한 추천을 드릴게요
          </h1>

          <p className="font-pretendard text-lg md:text-2xl text-gray-700 mt-4">
            입력하지 않고{" "}
            <span className="font-semibold text-gray-900">나중에 설정</span>
            하셔도 괜찮아요.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            {[
              "예식일 기준 혜택/이벤트 자동 추천",
              "예식 지역에 맞는 웨딩홀·업체 매칭",
              "모바일과 동일한 단계형 가입 플로우",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-[6px] h-2 w-2 rounded-full bg-[#FF4646]" />
                <span className="font-pretendard">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Right — Form 카드 */}
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
                  <span className="text-gray-500">예식 정보</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-full bg-[#FF4646] rounded-full" />
                </div>
              </div>

              {/* 타이틀 */}
              <h3 className="mt-6 mb-6 text-[26px] md:text-[28px] leading-[38px] font-bold tracking-[-0.3px] text-[#1E2124] whitespace-pre-line">
                예식 정보를
                {"\n"}
                입력해 주세요
              </h3>

              {/* 예식일 */}
              <div className="mb-5">
                <label className="block text-[#666] text-[12px] leading-[18px] -tracking-[0.1px] mb-[6px]">
                  예식일
                </label>
                <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white px-4">
                  <input
                    type="date"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    min={minDate}
                    placeholder="YYYY-MM-DD"
                    className="w-full h-full outline-none text-[14px] tracking-[-0.2px] text-[#111827] placeholder:text-[#9D9D9D] bg-transparent"
                  />
                </div>
              </div>

              {/* 예식 지역 */}
              <div className="mb-2">
                <label className="block text-[#666] text-[12px] leading-[18px] -tracking-[0.1px] mb-[6px]">
                  예식 지역
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* 시/도 */}
                  <div className="relative">
                    <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white px-4">
                      <select
                        value={weddingSido}
                        onChange={(e) => {
                          setWeddingSido(e.target.value);
                          setWeddingSigungu("");
                        }}
                        className="w-full h-full outline-none bg-transparent text-[14px] text-[#1E2124] appearance-none pr-7"
                      >
                        <option value="">시/도 선택</option>
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
                        value={weddingSigungu}
                        onChange={(e) => setWeddingSigungu(e.target.value)}
                        disabled={!weddingSido}
                        className="w-full h-full outline-none bg-transparent text-[14px] text-[#1E2124] disabled:text-[#9D9D9D] appearance-none pr-7"
                      >
                        <option value="">
                          {weddingSido ? "시/군/구 선택" : "시/도를 먼저 선택"}
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

              {/* 안내 문구 */}
              <p className="mt-3 text-[12px] text-gray-500">
                예식 정보는 마이페이지에서 언제든지 수정할 수 있어요.
              </p>

              {/* 액션 버튼들 */}
              <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full sm:w-[180px] h-[52px] rounded-[12px] text-[#999999] text-[14px] font-semibold border border-transparent hover:bg-gray-50 transition"
                >
                  나중에 하기
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isComplete}
                  className={`w-full sm:w-[220px] h-[56px] rounded-[12px] text-white text-[16px] font-semibold transition-transform active:scale-[0.99] ${
                    isComplete
                      ? "bg-[#FF4646] hover:brightness-95"
                      : "bg-[#D9D9D9] cursor-not-allowed"
                  }`}
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
