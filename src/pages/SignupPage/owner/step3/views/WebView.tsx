import { useCallback, useEffect, useMemo, useState, useId } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

interface WebBusinessInfoViewProps {
  onBack?: () => void;
  onNext?: (payload: {
    bzName: string;
    bzNumber: string;
    bankAccount: string;
    bankName: string;
  }) => void;
  onSkip?: () => void;
  title?: string;
}

// 🔹 location.state 타입 정의 (any 제거)
interface OwnerSignUpLocationState {
  bzName?: string;
  bzNumber?: string;
  bankAccount?: string;
  bankName?: string;
  [key: string]: unknown;
}

export default function WebView({
  onBack,
  onNext,
  onSkip,
  title = "",
}: WebBusinessInfoViewProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 prevState를 useMemo로 분리 + 명시적 타입
  const prevState = useMemo(
    () => (location.state ?? {}) as OwnerSignUpLocationState,
    [location.state]
  );

  const [bzName, setBzName] = useState("");
  const [bzNumber, setBzNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const uid = useId();
  const idBzName = `${uid}-bzName`;
  const idBzNumber = `${uid}-bzNumber`;
  const idBankName = `${uid}-bankName`;
  const idBankAccount = `${uid}-bankAccount`;

  const isComplete = useMemo(
    () => Boolean(bzName && bzNumber && bankName && bankAccount),
    [bzName, bzNumber, bankName, bankAccount]
  );

  // ✅ 사업자번호 자동 하이픈(000-00-00000)
  const formatBizNumber = useCallback((value: string) => {
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
  }, []);

  const handleNext = useCallback(() => {
    if (!isComplete) return;

    onNext?.({
      bzName,
      bzNumber,
      bankAccount,
      bankName,
    });

    navigate("/sign-up/owner/step4", {
      state: {
        ...prevState,
        bzName,
        bzNumber,
        bankAccount,
        bankName,
      },
    });
  }, [
    isComplete,
    onNext,
    navigate,
    prevState,
    bzName,
    bzNumber,
    bankAccount,
    bankName,
  ]);

  const handleSkip = useCallback(() => {
    onSkip?.();
    navigate("/sign-up/owner/step4", {
      state: {
        ...prevState,
      },
    });
  }, [onSkip, navigate, prevState]);

  // 접근성: Enter 키로 다음 진행
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext]);

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col mt-15">
      <main className="mx-auto max-w-6xl w-full px-4 md:px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
        {/* Left — Hero 카피 */}
        <section className="md:col-span-6 flex flex-col justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FF4646]/10 text-[#FF4646] text-xs font-semibold px-3 py-1 w-fit ring-1 ring-[#FF4646]/20">
            <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
            간편 회원가입
          </span>

          <h1 className="font-allimjang text-[44px] md:text-[56px] leading-[1.05] mt-3 tracking-[-0.02em]">
            <span className="text-[#FF4646]">사업장 정보</span>를 입력해 주세요
          </h1>

          <p className="font-pretendard text-lg md:text-2xl text-gray-700 mt-4">
            정확한 정보 입력은{" "}
            <span className="font-semibold text-gray-900">정산/세금처리</span>의
            첫걸음이에요.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            {[
              "사업자번호 자동 하이픈",
              "명확한 단계 표시",
              "모바일·웹 동일 UX",
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
                  {title || "회원가입"}
                </h2>
                <div className="w-10" />
              </div>

              {/* 진행도 */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm text-[#1E2124]">
                  <span>3 / 3</span>
                  <span className="text-gray-500">사업장 정보</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-full bg-[#FF4646] rounded-full" />
                </div>
              </div>

              {/* 타이틀 */}
              <h3 className="mt-6 mb-6 text-[26px] md:text-[28px] leading-[38px] font-bold tracking-[-0.3px] text-[#1E2124]">
                사업장 정보를
                <br />
                입력해 주세요
              </h3>

              {/* 폼 필드 */}
              <div className="space-y-4">
                {/* 사업장명 */}
                <div className="space-y-2">
                  <label
                    htmlFor={idBzName}
                    className="block text-[#666666] text-[12px] leading-[18px] -tracking-[0.1px]"
                  >
                    사업장명
                  </label>
                  <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white">
                    <input
                      id={idBzName}
                      type="text"
                      value={bzName}
                      onChange={(e) => setBzName(e.target.value)}
                      placeholder="사업장 명"
                      className="w-full h-full px-4 text-[14px] tracking-[-0.2px] text-[#111827] placeholder:text-[#9D9D9D] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 사업자 번호 */}
                <div className="space-y-2">
                  <label
                    htmlFor={idBzNumber}
                    className="block text-[#666666] text-[12px] leading-[18px] -tracking-[0.1px]"
                  >
                    사업자 번호
                  </label>
                  <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white">
                    <input
                      id={idBzNumber}
                      inputMode="numeric"
                      type="text"
                      value={bzNumber}
                      onChange={(e) =>
                        setBzNumber(formatBizNumber(e.target.value))
                      }
                      placeholder="000-00-00000"
                      className="w-full h-full px-4 text-[14px] tracking-[-0.2px] text-[#111827] placeholder:text-[#9D9D9D] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 은행명 */}
                <div className="space-y-2">
                  <label
                    htmlFor={idBankName}
                    className="block text-[#666666] text-[12px] leading-[18px] -tracking-[0.1px]"
                  >
                    은행명
                  </label>
                  <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white">
                    <input
                      id={idBankName}
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="은행명"
                      className="w-full h-full px-4 text-[14px] tracking-[-0.2px] text-[#111827] placeholder:text-[#9D9D9D] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 계좌번호 */}
                <div className="space-y-2">
                  <label
                    htmlFor={idBankAccount}
                    className="block text-[#666666] text-[12px] leading-[18px] -tracking-[0.1px]"
                  >
                    계좌번호
                  </label>
                  <div className="h-[54px] rounded-[12px] border border-[#E5E7EB] flex items-center bg-white">
                    <input
                      id={idBankAccount}
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="계좌번호"
                      className="w-full h-full px-4 text-[14px] tracking-[-0.2px] text-[#111827] placeholder:text-[#9D9D9D] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 액션 바 */}
              <div className="mt-9 flex flex-col sm:flex-row gap-3 sm:justify-between">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full sm:w-[220px] h-[56px] rounded-[12px] border border-gray-300 text-[14px] font-semibold text-[#666666] hover:bg-black/5 transition"
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

              {/* 약관 안내 */}
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
