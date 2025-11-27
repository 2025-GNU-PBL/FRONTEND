import { useState } from "react";
import { Icon } from "@iconify/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../../store/store";
import { submitOwnerSignup } from "../../../../../store/thunkFunctions";
import signupImg from "../../../../../assets/images/signup.png";

interface WebCompleteViewProps {
  onStart?: () => void;
  title?: string;
  descriptionLine1?: string;
  descriptionLine2?: string;
}

interface OwnerSignupWebState {
  phoneNumber?: string;
  phone?: string;
  bzName?: string;
  bzNumber?: string;
  bankAccount?: string;
  accountNumber?: string;
  bankName?: string; // ✅ 은행명 추가
  zipCode?: string;
  zipcode?: string;
  roadAddress?: string;
  address?: string;
  jibunAddress?: string;
  detailAddress?: string;
  buildingName?: string;
  extraAddress?: string;
}

export default function WebView({
  onStart,
  title = "환영합니다!",
  descriptionLine1 = "비교·예약·상담까지",
  descriptionLine2 = "웨딩픽으로 간편하게 해결하세요",
}: WebCompleteViewProps) {
  const nav = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const state = (location.state as OwnerSignupWebState) || {};

  // step1/2/3 에서 넘어온 raw 값들 호환 처리
  const phoneNumber = state.phoneNumber ?? state.phone ?? ""; // step1: phone
  const bzName = state.bzName ?? "";
  const bzNumber = state.bzNumber ?? "";
  const bankAccount = state.bankAccount ?? state.accountNumber ?? "";
  const bankName = state.bankName ?? ""; // ✅ step3에서 넘어온 은행명

  const zipCode = state.zipCode ?? state.zipcode ?? "";
  const roadAddress = state.roadAddress ?? state.address ?? "";
  const jibunAddress = state.jibunAddress ?? "";
  const detailAddress = state.detailAddress ?? "";
  const buildingNameRaw = state.buildingName ?? state.extraAddress ?? "";
  const buildingName =
    typeof buildingNameRaw === "string"
      ? buildingNameRaw.replace(/[()]/g, "")
      : "";

  // submitOwnerSignup 이 기대하는 DTO 형태
  const ownerValues = {
    phoneNumber,
    bzName,
    bzNumber,
    bankAccount,
    bankName, // ✅ thunk로 같이 전달
    zipCode,
    roadAddress,
    jibunAddress,
    detailAddress,
    buildingName,
  };

  const handleStart = async () => {
    if (isSubmitting) return;

    // 필수값 가드 (thunk와 동일 기준)
    if (!phoneNumber || !bzName || !bzNumber || !bankAccount || !bankName) {
      alert("사장 회원가입 필수 정보가 부족합니다. 이전 단계를 확인해 주세요.");
      console.log("[owner-complete:web] invalid ownerValues:", ownerValues);
      return;
    }

    console.log("[owner-complete:web] location.state:", state);
    console.log("[owner-complete:web] ownerValues:", ownerValues);

    setIsSubmitting(true);
    try {
      await dispatch(submitOwnerSignup(ownerValues)).unwrap();
      onStart?.();
      nav("/");
    } catch (err: unknown) {
      console.error("[submitOwnerSignup:web] error:", err);

      let message = "회원가입 제출에 실패했습니다.";

      if (typeof err === "string") {
        message = err;
      } else if (err instanceof Error) {
        message = err.message;
      }

      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col mt-15">
      <main className="mx-auto max-w-6xl w-full px-4 md:px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
        {/* Left - 카피 영역 */}
        <section className="md:col-span-6 flex flex-col justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FF4646]/10 text-[#FF4646] text-xs font-semibold px-3 py-1 w-fit ring-1 ring-[#FF4646]/20">
            <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
            간편 회원가입
          </span>

          <h1 className="font-allimjang text-[44px] md:text-[56px] leading-[1.05] mt-3 tracking-[-0.02em]">
            <span className="text-[#FF4646]">가입이 완료</span>되었습니다
          </h1>

          <p className="font-pretendard text-lg md:text-2xl text-gray-700 mt-4">
            이제{" "}
            <span className="font-semibold text-gray-900">
              맞춤 추천, 비교, 예약
            </span>
            을 한 곳에서 시작해 보세요.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            {[
              "회원 전용 혜택 & 알림 제공",
              "관심 업체 빠른 비교 · 상담",
              "모바일 · 웹 동일 UX",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-[6px] h-2 w-2 rounded-full bg-[#FF4646]" />
                <span className="font-pretendard">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Right - 카드 영역 */}
        <section className="md:col-span-6 flex justify-center md:justify-end">
          <div className="relative w-full max-w-[520px]">
            <div className="absolute inset-0 -z-10 blur-xl rounded-3xl bg-gradient-to-br from-[#FF4646]/15 via-white to-[#111827]/5" />
            <div className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rounded-3xl bg-white" />

            <div className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur p-7 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="text-center mt-2">
                <h2 className="text-[26px] md:text-[28px] leading-[38px] font-bold tracking-[-0.3px] text-[#1E2124]">
                  {title}
                </h2>
                <p className="mt-3 text-[16px] leading-[26px] text-[#666]">
                  {descriptionLine1}
                  <br />
                  {descriptionLine2}
                </p>
              </div>

              <div className="mt-8 flex justify-center">
                <img
                  src={signupImg}
                  alt="가입 완료 일러스트"
                  className="w-[156px] h-[156px] object-contain select-none"
                  draggable={false}
                />
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:justify-center">
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={isSubmitting}
                  className={`w-full sm:w-[220px] h-[56px] rounded-[12px] bg-[#FF2233] text-white text-[16px] font-semibold transition-transform active:scale-[0.99] ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "처리 중..." : "시작하기"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
