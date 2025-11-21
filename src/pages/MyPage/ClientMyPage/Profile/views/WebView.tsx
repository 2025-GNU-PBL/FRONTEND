import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import type { CustomerData } from "../../../../../store/userSlice";
import api from "../../../../../lib/api/axios";
import { useRefreshAuth } from "../../../../../hooks/useRefreshAuth";

// 카드 레이아웃 컴포넌트
function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white/95 backdrop-blur border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <h3 className="text-[18px] font-semibold tracking-[-0.3px] text-gray-900">
          {title}
        </h3>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className="px-6">
        <div className="h-px bg-gray-100" />
      </div>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center py-3">
      <div className="text-sm text-gray-500 tracking-[-0.2px]">{label}</div>
      <div className="text-sm text-gray-900 tracking-[-0.2px] break-words">
        {value ?? "-"}
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

  // 회원 탈퇴 모달 오픈 여부
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);

  const handleGoToEdit = () => {
    navigate("/my-page/client/profile/edit");
  };

  // 회원 탈퇴 버튼 클릭 -> 모달만 오픈
  const handleOpenWithdrawModal = () => {
    setShowWithdrawModal(true);
  };

  // 모달에서 "취소" 클릭
  const handleCancelWithdraw = () => {
    setShowWithdrawModal(false);
  };

  // 모달에서 "탈퇴할래요" 클릭 -> 실제 탈퇴 API 호출 (모바일과 동일 로직)
  const handleConfirmWithdraw = async () => {
    try {
      await api.delete("/api/v1/customer");

      refreshAuth();

      navigate("/");
    } catch (error) {
      console.error("회원 탈퇴 요청 중 에러 발생:", error);
    } finally {
      setShowWithdrawModal(false);
    }
  };

  const weddingPlace =
    customerData?.weddingSido && customerData?.weddingSigungu
      ? `${customerData.weddingSido} ${customerData.weddingSigungu}`
      : "예식 장소";

  return (
    <main className="w-full bg-[#F6F7FB] min-h-screen mt-15 relative">
      <div className="pt-10 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 프로필 히어로 카드 */}
          <section className="rounded-2xl bg-white/95 backdrop-blur border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300" />
                  <div className="min-w-0">
                    <div className="text-[20px] font-semibold text-gray-900 tracking-[-0.2px] truncate">
                      {customerData?.name || "홍종민"}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 tracking-[-0.2px]">
                      반가워요! 오늘도 좋은 하루 👋
                    </div>
                  </div>
                </div>

                {/* 히어로 영역 상단 수정 버튼 */}
                <button
                  type="button"
                  onClick={handleGoToEdit}
                  className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#4170FF] bg-[#F5F7FF] px-4 py-2 text-xs font-medium text-[#3051D8] tracking-[-0.2px] hover:bg-[#E4EBFF] hover:border-[#3051D8] transition-colors"
                >
                  <Icon
                    icon="majesticons:edit-pen-2-line"
                    className="w-4 h-4"
                  />
                  <span>회원 정보 수정</span>
                </button>
              </div>
            </div>
          </section>

          {/* 회원정보 카드 */}
          <SectionCard title="회원정보">
            <div className="divide-y divide-gray-100">
              <InfoRow label="고객명" value={customerData?.name || "홍종민"} />
              <div className="h-px bg-gray-100" />
              <InfoRow
                label="전화번호"
                value={customerData?.phoneNumber || "010-1234-5678"}
              />
              <div className="h-px bg-gray-100" />
              <InfoRow label="이메일" value={customerData?.email || "이메일"} />
              <div className="h-px bg-gray-100" />
              <InfoRow label="주소" value={customerData?.address || "주소"} />
            </div>
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-gray-500"
                onClick={handleOpenWithdrawModal}
              >
                회원 탈퇴
              </button>
            </div>
          </SectionCard>

          {/* 예식정보 카드 */}
          <SectionCard title="예식정보">
            <div className="divide-y divide-gray-100">
              <InfoRow
                label="예식일"
                value={customerData?.weddingDate || "예식일"}
              />
              <div className="h-px bg-gray-100" />
              <InfoRow label="예식장소" value={weddingPlace} />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* 회원 탈퇴 확인 모달 (모바일과 동일 로직) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[360px] rounded-2xl bg-white px-6 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
            <div className="w-full flex justify-center mb-3">
              <div className="w-10 h-10 rounded-full bg-[#FFF2F2] flex items-center justify-center">
                <Icon
                  icon="solar:warning-triangle-bold"
                  className="w-6 h-6 text-[#FF4D4F]"
                />
              </div>
            </div>

            <p className="text-center font-[Pretendard] text-[16px] leading-[24px] tracking-[-0.2px] text-[#1E2124] font-semibold">
              정말 탈퇴하시겠어요?
            </p>
            <p className="mt-2 text-center text-[13px] leading-[20px] tracking-[-0.2px] text-[#777777]">
              탈퇴 후에는 계정 및 예식 정보가
              <br />
              복구되지 않을 수 있어요.
            </p>

            <div className="mt-5 flex flex-row gap-2">
              <button
                type="button"
                className="flex-1 h-11 rounded-full border border-[#D9D9D9] text-[14px] leading-[21px] tracking-[-0.2px] text-[#666666]"
                onClick={handleCancelWithdraw}
              >
                취소
              </button>
              <button
                type="button"
                className="flex-1 h-11 rounded-full bg-[#FF4D4F] text-white text-[14px] leading-[21px] tracking-[-0.2px]"
                onClick={handleConfirmWithdraw}
              >
                탈퇴할래요
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default WebView;
