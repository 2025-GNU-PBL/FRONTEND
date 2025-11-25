// src/pages/SignupPage/complete/MobileView.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../../store/store";
import { submitSignup } from "../../../../../store/thunkFunctions";
import signupImg from "../../../../../assets/images/signup.png";
import { useRefreshAuth } from "../../../../../hooks/useRefreshAuth";

// location.state 타입 정의
interface SignupCompleteState {
  phone?: string;
  zipcode?: string;
  address?: string;
  detailAddress?: string;
  extraAddress?: string;
  weddingDate?: string;
  weddingSido?: string;
  weddingSigungu?: string;
}

interface MobileCompleteViewProps {
  title?: string;
  descriptionLine1?: string;
  descriptionLine2?: string;
}

export default function MobileView({
  title = "환영합니다!",
  descriptionLine1 = "비교·예약·상담까지",
  descriptionLine2 = "웨딩픽으로 간편하게 해결하세요",
}: MobileCompleteViewProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshAuth } = useRefreshAuth();

  const location = useLocation();
  const state = (location.state as SignupCompleteState) || {};

  const {
    phone,
    zipcode,
    address,
    detailAddress,
    extraAddress,
    weddingDate,
    weddingSido,
    weddingSigungu,
  } = state;

  // DTO 타입 정의
  interface SignupPayload {
    phone: string;
    address: string;
    zipCode: string;
    roadAddress: string;
    jibunAddress: string;
    detailAddress: string;
    sido: string;
    sigungu: string;
    dong: string;
    buildingName: string;
    weddingSido?: string;
    weddingSigungu?: string;
    weddingDate?: string;
  }

  const formValues: SignupPayload = {
    phone: phone ?? "",
    address: address ?? "",
    zipCode: zipcode ?? "",
    roadAddress: address ?? "",
    jibunAddress: "",
    detailAddress: detailAddress ?? "",
    sido: "",
    sigungu: "",
    dong: "",
    buildingName: (extraAddress ?? "").replace(/[()]/g, ""),
    weddingSido,
    weddingSigungu,
    weddingDate,
  };

  const handleStart = async () => {
    if (isSubmitting) return;

    if (!phone || !address || !detailAddress) {
      alert(
        "전화번호/주소/상세주소가 비어 있습니다. 이전 단계 입력을 확인해 주세요."
      );
      return;
    }

    console.log("[complete] location.state:", state);
    console.log("[complete] formValues:", formValues);

    setIsSubmitting(true);
    try {
      await dispatch(submitSignup(formValues)).unwrap();
      refreshAuth();
      navigate("/");
    } catch (err) {
      console.error("[submitSignup] error:", err);

      const message =
        err instanceof Error ? err.message : "회원가입 제출에 실패했습니다.";

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

          <p className="mt-2 mx-auto max-w-[199px] text-center text-[16px] leading-[26px] tracking-[-0.2px] text-[#666666]">
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
