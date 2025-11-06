import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

export default function WebView() {
  const [phone, setPhone] = useState("");
  const nav = useNavigate();

  // 간단 유효성: 010-0000-0000 또는 하이픈 없이 11자리
  const isValid = useMemo(() => {
    const onlyNum = phone.replace(/\D/g, "");
    return /^010\d{8}$/.test(onlyNum);
  }, [phone]);

  const onNext = () => {
    if (!isValid) return;
    // step2로 이동하며 state에 phone 전달
    nav("/sign-up/step2", {
      state: { phone },
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
      {/* 상단 얇은 그라디언트 바 */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <main className="mx-auto max-w-6xl w-full px-4 md:px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
        {/* Left — Hero 카피 */}
        <section className="md:col-span-6 flex flex-col justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FF4646]/10 text-[#FF4646] text-xs font-semibold px-3 py-1 w-fit ring-1 ring-[#FF4646]/20">
            <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
            간편 회원가입
          </span>

          <h1 className="font-allimjang text-[44px] md:text-[56px] leading-[1.05] mt-3 tracking-[-0.02em]">
            <span className="text-[#FF4646]">1분</span> 만에 시작해요
          </h1>

          <p className="font-pretendard text-lg md:text-2xl text-gray-700 mt-4">
            후기가 검증된 업체와{" "}
            <span className="font-semibold text-gray-900">맞춤 상담</span>을
            연결해 드려요.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            {["실시간 비교", "혜택/이벤트 안내", "모바일·웹 이어서 진행"].map(
              (t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-[6px] h-2 w-2 rounded-full bg-[#FF4646]" />
                  <span className="font-pretendard">{t}</span>
                </li>
              )
            )}
          </ul>
        </section>

        {/* Right — Form 카드 */}
        <section className="md:col-span-6 flex justify-center md:justify-end">
          <div className="relative w-full max-w-[520px]">
            {/* soft glow & offset */}
            <div className="absolute inset-0 -z-10 blur-xl rounded-3xl bg-gradient-to-br from-[#FF4646]/15 via-white to-[#111827]/5" />
            <div className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rounded-3xl bg-white" />

            <div className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur p-7 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              {/* 헤더 라인 */}
              <div className="flex items-center justify-between">
                <button
                  aria-label="back"
                  onClick={() => history.back()}
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
                  <span>1 / 3</span>
                  <span className="text-gray-500">전화번호 입력</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-1/3 bg-[#FF4646] rounded-full" />
                </div>
              </div>

              {/* 타이틀 */}
              <h3 className="mt-6 text-[26px] md:text-[28px] leading-[38px] font-bold tracking-[-0.3px] text-[#1E2124]">
                전화번호를
                <br />
                입력해 주세요
              </h3>

              {/* 입력 필드 그룹 */}
              <div className="mt-7">
                <label className="block text-[12px] text-[#666666]">
                  전화번호
                </label>
                <div className="mt-2 relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="
                      w-full h-[54px] rounded-[12px]
                      border border-[#E5E7EB]
                      px-4 pr-11 text-[14px] tracking-[-0.2px]
                      text-[#111827] placeholder:text-[#9D9D9D]
                      focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-[#D1D5DB]
                      bg-white
                    "
                  />
                  <Icon
                    icon={
                      isValid
                        ? "solar:check-circle-linear"
                        : "solar:shield-cross-linear"
                    }
                    className={`
                      absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5
                      ${isValid ? "text-emerald-500" : "text-gray-300"}
                    `}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  하이픈은 자동으로 처리됩니다. 본인 명의 휴대폰 번호를 입력해
                  주세요.
                </p>
              </div>

              {/* 액션 바 */}
              <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!isValid}
                  className={`
                    w-full sm:w-[220px] h-[56px] rounded-[12px]
                    text-white text-[16px] font-semibold
                    transition-transform active:scale-[0.99]
                    ${
                      isValid
                        ? "bg-[#FF4646] hover:brightness-95"
                        : "bg-[#D9D9D9] cursor-not-allowed"
                    }
                  `}
                >
                  다음
                </button>
              </div>

              {/* 약관 푸터 */}
              <p className="mt-5 text-[12px] text-gray-500 text-center">
                계속 진행하면{" "}
                <a
                  href="#"
                  className="underline underline-offset-2 hover:text-[#FF4646]"
                >
                  서비스 이용약관
                </a>
                과{" "}
                <a
                  href="#"
                  className="underline underline-offset-2 hover:text-[#FF4646]"
                >
                  개인정보처리방침
                </a>
                에 동의한 것으로 간주됩니다.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
