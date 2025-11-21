import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import type { CustomerData } from "../../../../../store/userSlice";
import api from "../../../../../lib/api/axios";
import { useRefreshAuth } from "../../../../../hooks/useRefreshAuth";

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

// 카드 레이아웃 컴포넌트
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white/95 backdrop-blur border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <h3 className="text-[18px] font-semibold tracking-[-0.3px] text-gray-900">
          {title}
        </h3>
      </div>
      <div className="px-6">
        <div className="h-px bg-gray-100" />
      </div>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center py-3">
      <div className="text-sm text-gray-500 tracking-[-0.2px]">{label}</div>
      <div className="text-sm text-gray-900 tracking-[-0.2px] break-words">
        {children}
      </div>
    </div>
  );
}

const WebView: React.FC = () => {
  const navigate = useNavigate();
  const { userData, role } = useAppSelector((state) => state.user);
  const { refreshAuth } = useRefreshAuth();

  // 모바일과 동일한 방식으로 CUSTOMER 데이터 좁히기
  const customerData =
    role === "CUSTOMER" && userData ? (userData as CustomerData) : null;

  const handleGoBack = () => {
    navigate(-1);
  };

  const weddingPlace =
    customerData?.weddingSido && customerData?.weddingSigungu
      ? `${customerData.weddingSido} ${customerData.weddingSigungu}`
      : "예식 장소";

  // ✨ 회원 정보 수정용 state (모바일과 동일)
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

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // customerData가 바뀌었을 때 formData 동기화 (모바일과 동일)
  React.useEffect(() => {
    if (!customerData) return;

    const _weddingPlace =
      customerData.weddingSido && customerData.weddingSigungu
        ? `${customerData.weddingSido} ${customerData.weddingSigungu}`
        : "";

    setFormData({
      phoneNumber: customerData.phoneNumber ?? "",
      address: customerData.address ?? "",
      zipCode: customerData.zipCode ?? "",
      roadAddress: customerData.roadAddress ?? "",
      detailAddress: customerData.detailAddress ?? "",
      buildingName: customerData.buildingName ?? "",
      weddingDate: customerData.weddingDate ?? "",
      weddingPlaceInput: _weddingPlace,
    });
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

  // ✨ 수정하기 버튼 클릭 시 PATCH 요청 (모바일과 동일 로직)
  const handleSubmit = async () => {
    if (!customerData) {
      alert("회원 정보를 불러오지 못했어요.");
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

      alert("회원 정보가 수정되었어요.");

      refreshAuth();

      navigate("/my-page/client/profile");
    } catch (error) {
      console.error(error);
      alert("수정에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full bg-[#F6F7FB] min-h-screen mt-15">
      <div className="pt-10 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 상단 헤더 영역 */}
          <header className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <Icon
                icon="solar:alt-arrow-left-linear"
                className="w-5 h-5 text-gray-500"
              />
              <span>내 정보로 돌아가기</span>
            </button>

            <div className="w-[120px]" />
          </header>

          {/* 프로필 히어로 카드 */}
          <section className="rounded-2xl bg-white/95 backdrop-blur border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
            <div className="px-6 py-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300" />
                <div className="min-w-0">
                  <div className="text-[20px] font-semibold text-gray-900 tracking-[-0.2px] truncate">
                    {customerData?.name || "홍종민"}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 tracking-[-0.2px]">
                    정보를 최신으로 업데이트해 보세요 ✏️
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 회원정보 카드 (입력 가능) */}
          <SectionCard title="회원정보">
            <div className="divide-y divide-gray-100">
              {/* 고객명 - 모바일처럼 read-only */}
              <InfoRow label="고객명">
                <span>{customerData?.name || "홍종민"}</span>
              </InfoRow>

              <div className="h-px bg-gray-100" />

              {/* 전화번호 - 입력 */}
              <InfoRow label="전화번호">
                <input
                  className="w-full bg-transparent outline-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#FF2233] focus:ring-1 focus:ring-[#FF2233]"
                  value={formData.phoneNumber}
                  onChange={handleChange("phoneNumber")}
                  placeholder={customerData?.phoneNumber || "010-1234-5678"}
                />
              </InfoRow>

              <div className="h-px bg-gray-100" />

              {/* 이메일 - read-only */}
              <InfoRow label="이메일">
                <span>{customerData?.email || "이메일"}</span>
              </InfoRow>

              <div className="h-px bg-gray-100" />

              {/* 주소 - 입력 */}
              <InfoRow label="주소">
                <input
                  className="w-full bg-transparent outline-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#FF2233] focus:ring-1 focus:ring-[#FF2233]"
                  value={formData.address}
                  onChange={handleChange("address")}
                  placeholder={customerData?.address || "주소"}
                />
              </InfoRow>
            </div>
          </SectionCard>

          {/* 예식정보 카드 (입력 가능) */}
          <SectionCard title="예식정보">
            <div className="divide-y divide-gray-100">
              {/* 예식일 */}
              <InfoRow label="예식일">
                <input
                  type="date"
                  className="w-full bg-transparent outline-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#FF2233] focus:ring-1 focus:ring-[#FF2233]"
                  value={formData.weddingDate || ""}
                  onChange={handleChange("weddingDate")}
                  placeholder={customerData?.weddingDate || "예식일"}
                />
              </InfoRow>

              <div className="h-px bg-gray-100" />

              {/* 예식 장소 - "시도 시군구" 한 줄 */}
              <InfoRow label="예식 장소">
                <input
                  className="w-full bg-transparent outline-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#FF2233] focus:ring-1 focus:ring-[#FF2233]"
                  value={formData.weddingPlaceInput}
                  onChange={handleChange("weddingPlaceInput")}
                  placeholder={weddingPlace}
                />
              </InfoRow>
            </div>
          </SectionCard>

          {/* 하단 수정하기 버튼 */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-8 h-[48px] rounded-[12px] bg-[#FF2233] text-white text-sm font-semibold tracking-[-0.2px] shadow-[0_8px_18px_rgba(255,34,51,0.35)] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            >
              {isSubmitting ? "저장 중..." : "수정하기"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default WebView;
