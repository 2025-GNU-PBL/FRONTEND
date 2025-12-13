import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import type { CustomerData } from "../../../../../store/userSlice";
import api from "../../../../../lib/api/axios";
import { useRefreshAuth } from "../../../../../hooks/useRefreshAuth";
import { toast } from "react-toastify";

type CustomerFormState = {
  phoneNumber: string;
  address: string;
  zipCode: string;
  roadAddress: string;
  detailAddress: string;
  buildingName: string;
  weddingDate: string;
  weddingPlaceInput: string; // 화면에는 "시도 시군구" 한 줄로 보여주기
};

const MobileView: React.FC = () => {
  const navigate = useNavigate();
  const { userData, role } = useAppSelector((state) => state.user);
  const { refreshAuth } = useRefreshAuth();

  // role과 userData를 보고 CustomerData로 좁혀주기
  const customerData =
    role === "CUSTOMER" && userData ? (userData as CustomerData) : null;

  const handleGoBack = () => {
    navigate(-1);
  };

  const weddingPlace =
    customerData?.weddingSido && customerData?.weddingSigungu
      ? `${customerData.weddingSido} ${customerData.weddingSigungu}`
      : "예식 장소";

  // ✨ 회원 정보 수정용 state
  const [formData, setFormData] = React.useState<CustomerFormState>({
    phoneNumber: customerData?.phoneNumber ?? "",
    address: customerData?.address ?? "",
    zipCode: customerData?.zipCode ?? "",
    roadAddress: customerData?.roadAddress ?? "",
    detailAddress: customerData?.detailAddress ?? "",
    buildingName: customerData?.buildingName ?? "",
    weddingDate: customerData?.weddingDate ?? "",
    weddingPlaceInput: weddingPlace === "예식 장소" ? "" : weddingPlace,
  });

  // 초기 값(원본) 따로 저장해서 변경 여부 체크용으로 사용
  const [initialFormData, setInitialFormData] =
    React.useState<CustomerFormState | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // customerData가 바뀌었을 때 formData + initialFormData 동기화
  React.useEffect(() => {
    if (!customerData) return;

    const _weddingPlace =
      customerData.weddingSido && customerData.weddingSigungu
        ? `${customerData.weddingSido} ${customerData.weddingSigungu}`
        : "";

    const nextData: CustomerFormState = {
      phoneNumber: customerData.phoneNumber ?? "",
      address: customerData.address ?? "",
      zipCode: customerData.zipCode ?? "",
      roadAddress: customerData.roadAddress ?? "",
      detailAddress: customerData.detailAddress ?? "",
      buildingName: customerData.buildingName ?? "",
      weddingDate: customerData.weddingDate ?? "",
      weddingPlaceInput: _weddingPlace,
    };

    setFormData(nextData);
    setInitialFormData(nextData);
  }, [customerData]);

  const handleChange =
    (field: keyof CustomerFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  // 🔍 변경 여부 체크: 초기 값(initialFormData)과 현재 값(formData)을 필드 단위로 비교
  const isChanged = React.useMemo(() => {
    if (!initialFormData) return false;

    return (Object.keys(initialFormData) as (keyof CustomerFormState)[]).some(
      (key) => initialFormData[key] !== formData[key]
    );
  }, [initialFormData, formData]);

  // ✨ 수정하기 버튼 클릭 시 PATCH 요청
  const handleSubmit = async () => {
    if (!customerData) {
      toast.error("회원 정보를 불러오지 못했어요.");
      return;
    }

    // 변경된 내용 없으면 요청 안 보내기
    if (!isChanged) {
      toast.error("변경된 내용이 없어요.");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // "서울 강남구" 형태를 시도 / 시군구로 분리
      let weddingSido = customerData.weddingSido ?? "";
      let weddingSigungu = customerData.weddingSigungu ?? "";

      if (formData.weddingPlaceInput.trim()) {
        const [sido, ...sigunguParts] = formData.weddingPlaceInput
          .trim()
          .split(" ");
        weddingSido = sido ?? "";
        weddingSigungu = sigunguParts.join(" ") ?? "";
      }

      await api.patch("/api/v1/customer", {
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        zipCode: formData.zipCode,
        roadAddress: formData.roadAddress,
        detailAddress: formData.detailAddress,
        buildingName: formData.buildingName,
        weddingSido,
        weddingSigungu,
        weddingDate:
          formData.weddingDate || customerData.weddingDate || "2025-11-20",
      });

      toast.success("회원 정보가 수정되었어요.");

      // 수정 후 다시 최신 정보로 동기화
      refreshAuth();

      navigate("/my-page/client/profile");
    } catch (error) {
      console.error(error);
      toast.error("수정에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-white overflow-hidden flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between h-[60px] px-5">
        {/* Back Button */}
        <button
          className="w-8 h-8 flex items-center justify-center"
          type="button"
          onClick={handleGoBack}
        >
          <Icon
            icon="solar:alt-arrow-left-linear"
            className="w-8 h-8 text-[#1E2124]"
          />
        </button>

        {/* Title */}
        <h1 className="font-[Pretendard] font-semibold text-[18px] leading-[29px] tracking-[-0.2px] text-[#1E2124]">
          회원 정보 수정
        </h1>

        {/* 오른쪽 비워두거나 나중에 아이콘 추가 가능 */}
        <div className="w-6 h-6" />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 w-full px-5 mt-[30px] overflow-y-auto pb-[120px]">
        <div className="w-full flex flex-col items-start gap-[30px]">
          {/* 프로필 */}
          <div className="flex flex-row items-center gap-4 h-[64px]">
            <div className="w-16 h-16 rounded-full bg-[#D9D9D9]" />
            <span className="font-[Pretendard] font-semibold text-[18px] leading-[29px] tracking-[-0.2px] text-black">
              {customerData?.name || "홍종민"}
            </span>
          </div>

          {/* 정보 섹션 전체 */}
          <div className="w-full flex flex-col items-start gap-[40px]">
            {/* 회원정보 */}
            <div className="w-full flex flex-col items-start gap-5">
              {/* 제목 */}
              <div className="w-full flex flex-row items-center justify-between">
                <span className="font-[Pretendard] text-[16px] leading-[26px] tracking-[-0.2px] text-black">
                  회원정보
                </span>
              </div>

              <div className="w-full border-t border-[#D9D9D9]" />

              {/* 1열(라벨) + 2열(값) 두 칼럼 정렬 */}
              <div className="w-full flex flex-col items-start gap-3">
                {/* 고객명 (이름은 여기서는 수정하지 않고 그대로 표시만) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    고객명
                  </span>
                  <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black ml-3">
                    {customerData?.name || "홍종민"}
                  </span>
                </div>

                {/* 전화번호 (수정 가능) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    전화번호
                  </span>
                  <input
                    className="ml-3 flex-1 text-[14px] leading-[21px] tracking-[-0.2px] text-black outline-none border-none bg-transparent"
                    value={formData.phoneNumber}
                    onChange={handleChange("phoneNumber")}
                    placeholder={customerData?.phoneNumber || "010-1234-5678"}
                  />
                </div>

                {/* 이메일 (현재는 백엔드 스펙에 없어 read-only 유지) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    이메일
                  </span>
                  <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black ml-3">
                    {customerData?.email || "이메일"}
                  </span>
                </div>

                {/* 주소 (수정 가능) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    주소
                  </span>
                  <input
                    className="ml-3 flex-1 text-[14px] leading-[21px] tracking-[-0.2px] text-black outline-none border-none bg-transparent"
                    value={formData.address}
                    onChange={handleChange("address")}
                    placeholder={customerData?.address || "주소"}
                  />
                </div>
              </div>
            </div>

            {/* 예식정보 */}
            <div className="w-full flex flex-col items-start gap-5">
              <span className="font-[Pretendard] text-[16px] leading-[26px] tracking-[-0.2px] text-black">
                예식정보
              </span>

              <div className="w-full border-t border-[#D9D9D9]" />

              <div className="w-full flex flex-col items-start gap-3">
                {/* 예식일 (수정 가능) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    예식일
                  </span>
                  <input
                    type="date"
                    className="ml-3 flex-1 text-[14px] leading-[21px] tracking-[-0.2px] text-black outline-none border-none bg-transparent"
                    value={formData.weddingDate || ""}
                    onChange={handleChange("weddingDate")}
                    placeholder={customerData?.weddingDate || "예식일"}
                  />
                </div>

                {/* 예식 장소 (수정 가능, "시도 시군구" 한 줄) */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    예식 장소
                  </span>
                  <input
                    className="ml-3 flex-1 text-[14px] leading-[21px] tracking-[-0.2px] text-black outline-none border-none bg-transparent"
                    value={formData.weddingPlaceInput}
                    onChange={handleChange("weddingPlaceInput")}
                    placeholder={weddingPlace}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ 하단 수정하기 버튼 */}
      <div className="absolute bottom-0 left-0 w-full h-[96px] flex flex-col items-start gap-[10px] px-5 py-5 bg-white">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isChanged || isSubmitting}
          className="flex flex-col justify-center items-center w-full h-[56px] bg-[#FF2233] rounded-[12px] py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-row justify-center items-center gap-2">
            <span className="font-semibold text-[16px] leading-[24px] tracking-[-0.2px] text-white">
              {isSubmitting ? "수정 중..." : "수정하기"}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default MobileView;
