// src/pages/SignupPage/complete/WebView.tsx
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../store/store";
import { submitSignup } from "../../../store/thunkFunctions";
import signupImg from "../../../assets/images/signup.png";

interface WebCompleteViewProps {
  /** 시작하기 버튼 클릭 시 실행 (성공 후 후행 동작이 필요할 때 사용) */
  onStart?: () => void;
  /** 문구 커스터마이즈 */
  title?: string;
  descriptionLine1?: string;
  descriptionLine2?: string;
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

  // step1/step2/step3에서 넘겨준 값 수신
  const location = useLocation();
  const {
    phone,
    zipcode,
    address,
    detailAddress,
    extraAddress,
    weddingDate,
    weddingSido,
    weddingSigungu,
  } = (location.state as any) || {};

  // 백엔드 제출 payload (Mobile과 동일 맵핑)
  const formValues = {
    phone,
    // 기본 주소 필드
    address, // 일반 주소
    zipCode: zipcode, // 우편번호
    roadAddress: address, // 도로명 주소로 동일 전달 (지번 분리 불가 시 동일 매핑)
    jibunAddress: "", // 수집 못했으면 빈값
    detailAddress, // 상세주소
    // 추가 정보
    sido: "", // 없으면 빈값
    sigungu: "",
    dong: "",
    buildingName: (extraAddress || "").replace(/[()]/g, ""),
    // 예식 정보
    weddingSido,
    weddingSigungu,
    weddingDate, // "YYYY-MM-DD"
  };

  const handleStart = async () => {
    if (isSubmitting) return;

    // 필수값 가드
    if (!phone || !address || !detailAddress) {
      alert(
        "전화번호/주소/상세주소가 비어 있습니다. 이전 단계 입력을 확인해 주세요."
      );
      return;
    }

    // 디버그 로그
    console.log("[complete:web] location.state:", location.state);
    console.log("[complete:web] formValues:", formValues);

    setIsSubmitting(true);
    try {
      await dispatch(submitSignup(formValues as any)).unwrap();
      // 성공 시 후행 콜백(optional)
      onStart?.();
      nav("/");
    } catch (err: any) {
      console.error("[submitSignup:web] error:", err);
      alert(
        typeof err === "string"
          ? err
          : err?.message || "회원가입 제출에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col mt-20">
      {/* 상단 얇은 그라디언트 바 */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <main className="mx-auto max-w-6xl w-full px-4 md:px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* Left — 카피 영역 */}
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

        {/* Right — 카드 영역 */}
        <section className="md:col-span-6 flex justify-center md:justify-end">
          <div className="relative w-full max-w-[520px]">
            {/* soft glow & offset */}
            <div className="absolute inset-0 -z-10 blur-xl rounded-3xl bg-gradient-to-br from-[#FF4646]/15 via-white to-[#111827]/5" />
            <div className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rounded-3xl bg-white" />

            <div className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur p-7 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              {/* 타이틀/설명 */}
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

              {/* 일러스트 이미지 */}
              <div className="mt-8 flex justify-center">
                <img
                  src={signupImg}
                  alt="가입 완료 일러스트"
                  className="w-[156px] h-[156px] object-contain select-none"
                  draggable={false}
                />
              </div>

              {/* 액션 바 */}
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
