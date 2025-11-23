// src/pages/SignupPage/complete/MobileView.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../../store/store";
import { submitOwnerSignup } from "../../../../../store/thunkFunctions";
import signupImg from "../../../../../assets/images/signup.png";
import { useRefreshAuth } from "../../../../../hooks/useRefreshAuth";

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
  const { refreshAuth } = useRefreshAuth();

  const location = useLocation();
  const {
    phoneNumber,
    bzName,
    bzNumber,
    bankAccount,
    zipcode,
    roadAddress,
    address,
    jibunAddress,
    detailAddress,
    buildingName,
    extraAddress,
  } = (location.state as any) || {};

  // DTO에 맞춰 변환 + address fallback
  const ownerValues = {
    phoneNumber,
    bzName,
    bzNumber,
    bankAccount,
    zipCode: zipcode,
    roadAddress: roadAddress || address || "",
    jibunAddress: jibunAddress || "",
    detailAddress: detailAddress || "",
    buildingName:
      buildingName || (extraAddress ? extraAddress.replace(/[()]/g, "") : ""),
  };

  const handleStart = async () => {
    if (isSubmitting) return;

    if (
      !ownerValues.phoneNumber ||
      !ownerValues.bzName ||
      !ownerValues.bzNumber ||
      !ownerValues.bankAccount ||
      !ownerValues.zipCode ||
      !ownerValues.roadAddress
    ) {
      alert("사장 회원가입 필수 정보가 부족합니다. 이전 단계를 확인해 주세요.");
      console.log("[owner-complete:mobile] invalid ownerValues:", ownerValues);
      return;
    }

    console.log("[owner-complete:mobile] location.state:", location.state);
    console.log("[owner-complete:mobile] ownerValues:", ownerValues);

    setIsSubmitting(true);
    try {
      await dispatch(submitOwnerSignup(ownerValues)).unwrap();
      refreshAuth();
      navigate("/");
    } catch (err: any) {
      console.error("[submitOwnerSignup:mobile] error:", err);
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
    <div className="relative w-[390px] h-[844px] bg-white overflow-hidden">
      <div className="absolute left-1/2 -translate-x-1/2 top-[169px] w-[335px]">
        <h1 className="mx-auto w-[237px] h-[36px] text-center text-[#1E2124] font-bold text-[24px] leading-[36px] tracking-[-0.3px]">
          {title}
        </h1>

        <p className="absolute left-1/2 -translate-x-1/2 top-[72px] w-[199px] h-[52px] text-center text-[#666] text-[16px] leading-[26px] tracking-[-0.2px]">
          {descriptionLine1}
          <br />
          {descriptionLine2}
        </p>

        <div
          className="absolute left-1/2 -translate-x-1/2 top-[204px] w-[156px] h-[156px]"
          aria-hidden
        >
          <img
            src={signupImg}
            alt="가입 완료 일러스트"
            className="w-[156px] h-[156px] object-contain"
            draggable={false}
          />
        </div>
      </div>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-[90px] w-[390px] px-[20px] z-50">
        <button
          type="button"
          onClick={handleStart}
          disabled={isSubmitting}
          className={`w-[350px] h-[56px] mx-auto rounded-[12px] bg-[#FF2233] text-white text-[16px] font-semibold active:scale-[0.99] transition ${
            isSubmitting ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "처리 중..." : "시작하기"}
        </button>
      </div>
    </div>
  );
}
