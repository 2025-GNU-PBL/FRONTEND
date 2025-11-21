// src/pages/SignupPage/complete/MobileView.tsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../store/store";
import { submitSignup } from "../../../../store/thunkFunctions";
import signupImg from "../../../../assets/images/signup.png";
import { useRefreshAuth } from "../../../../hooks/useRefreshAuth";

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
  const { refreshAuth } = useRefreshAuth;

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

  const formValues = {
    phone,
    // 기본 주소 필드
    address, // 일반 주소
    zipCode: zipcode, // 우편번호
    roadAddress: address, // 도로명 주소로 동일 전달 (지번이 없으므로 동일 매핑)
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

    // 필수값 가드(전화번호/주소/상세주소)
    if (!phone || !address || !detailAddress) {
      alert(
        "전화번호/주소/상세주소가 비어 있습니다. 이전 단계 입력을 확인해 주세요."
      );
      return;
    }

    // 실제로 어떤 값이 백엔드로 가는지 눈으로 확인
    console.log("[complete] location.state:", location.state);
    console.log("[complete] formValues:", formValues);

    setIsSubmitting(true);
    try {
      // payload를 인자로 넘겨 호출 (수정된 thunk가 받아 사용)
      await dispatch(submitSignup(formValues as any)).unwrap();
      refreshAuth();
      navigate("/");
    } catch (err: any) {
      console.error("[submitSignup] error:", err);
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
      {/* 본문 컨텐츠 */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[169px] w-[335px]">
        {/* 타이틀 */}
        <h1 className="mx-auto w-[237px] h-[36px] text-center text-[#1E2124] font-bold text-[24px] leading-[36px] tracking-[-0.3px]">
          {title}
        </h1>

        {/* 설명 */}
        <p className="absolute left-1/2 -translate-x-1/2 top-[72px] w-[199px] h-[52px] text-center text-[#666] text-[16px] leading-[26px] tracking-[-0.2px]">
          {descriptionLine1}
          <br />
          {descriptionLine2}
        </p>

        {/* 일러스트 이미지 */}
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

      {/* 하단 버튼 */}
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
