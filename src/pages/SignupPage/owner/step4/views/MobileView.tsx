// src/pages/SignupPage/complete/MobileView.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../../store/store";
import { submitOwnerSignup } from "../../../../../store/thunkFunctions";
import signupImg from "../../../../../assets/images/signup.png";

interface OwnerSignupState {
  phoneNumber?: string;
  bzName?: string;
  bzNumber?: string;
  bankAccount?: string;
  bankName?: string; // ✅ 은행명 추가
  zipcode?: string;
  roadAddress?: string;
  address?: string;
  jibunAddress?: string;
  detailAddress?: string;
  buildingName?: string;
  extraAddress?: string;
}

interface MobileCompleteViewProps {
  title?: string;
  descriptionLine1?: string;
  descriptionLine2?: string;
}

export default function MobileView({
  title = "환영합니다!",
  descriptionLine1 = "스드메 예약과 홍보,",
  descriptionLine2 = "이제 웨딩픽에서 해결하세요",
}: MobileCompleteViewProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const state = (location.state as OwnerSignupState) || {};

  const {
    phoneNumber,
    bzName,
    bzNumber,
    bankAccount,
    bankName, // ✅ state에서 은행명 꺼내기
    zipcode,
    roadAddress,
    address,
    jibunAddress,
    detailAddress,
    buildingName,
    extraAddress,
  } = state;

  // DTO 변환
  const ownerValues = {
    phoneNumber,
    bzName,
    bzNumber,
    bankAccount,
    bankName, // ✅ 최종 payload에 bankName 포함
    zipCode: zipcode,
    roadAddress: roadAddress || address || "",
    jibunAddress: jibunAddress || "",
    detailAddress: detailAddress || "",
    buildingName:
      buildingName || (extraAddress ? extraAddress.replace(/[()]/g, "") : ""),
  };

  const handleStart = async () => {
    if (isSubmitting) return;

    // ✅ bankName 필수값 체크 추가
    if (
      !ownerValues.phoneNumber ||
      !ownerValues.bzName ||
      !ownerValues.bzNumber ||
      !ownerValues.bankAccount ||
      !ownerValues.bankName ||
      !ownerValues.zipCode ||
      !ownerValues.roadAddress
    ) {
      alert("사장 회원가입 필수 정보가 부족합니다. 이전 단계를 확인해 주세요.");
      console.log("[owner-complete:mobile] invalid ownerValues:", ownerValues);
      return;
    }

    console.log("[owner-complete:mobile] location.state:", state);
    console.log("[owner-complete:mobile] ownerValues:", ownerValues);

    setIsSubmitting(true);
    try {
      await dispatch(submitOwnerSignup(ownerValues)).unwrap();
      navigate("/");
    } catch (err: unknown) {
      console.error("[submitOwnerSignup:mobile] error:", err);

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
    <div className="relative flex w-full min-h-screen flex-col bg-white">
      <main className="flex flex-1 flex-col items-center px-5 pb-32">
        <div className="w-full max-w-[335px] pt-[169px] flex flex-col items-center gap-2">
          <h1 className="mx-auto max-w-[237px] text-center text-[24px] leading-[36px] tracking-[-0.3px] font-bold text-[#1E2124]">
            {title}
          </h1>

          <p className="mt-2 mx-auto max-w-[172px] text-center text-[16px] leading-[26px] tracking-[-0.2px] text-[#666666]">
            {descriptionLine1}
            <br />
            {descriptionLine2}
          </p>
        </div>

        <div className="mt-[80px]" aria-hidden>
          <img
            src={signupImg}
            alt="가입 완료 일러스트"
            className="w-[156px] h-[156px] object-contain"
            draggable={false}
          />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 w-full px-5 pb-5 z-50">
        <button
          type="button"
          onClick={handleStart}
          disabled={isSubmitting}
          className={`w-full h-[56px] rounded-[12px] bg-[#FF2233] text-white text-[16px] font-semibold active:scale-[0.99] transition ${
            isSubmitting ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "처리 중..." : "시작하기"}
        </button>
      </div>
    </div>
  );
}
