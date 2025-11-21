import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import type { CustomerData } from "../../../../../store/userSlice";
import api from "../../../../../lib/api/axios";
import { useRefreshAuth } from "../../../../../hooks/useRefreshAuth";

const MobileView: React.FC = () => {
  const navigate = useNavigate();
  const { userData, role } = useAppSelector((state) => state.user);
  const { refreshAuth } = useRefreshAuth();

  // role과 userData를 보고 CustomerData로 좁혀주기
  const customerData =
    role === "CUSTOMER" && userData ? (userData as CustomerData) : null;

  // 회원 탈퇴 모달 오픈 여부
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);

  const handleGoBack = () => {
    navigate(-1);
  };

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

  // 모달에서 "탈퇴할래요" 클릭 -> 실제 탈퇴 API 호출
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
    <div className="relative mx-auto w-[390px] h-[844px] bg-white overflow-hidden">
      {/* 상단 헤더 */}
      <div className="absolute top-0 left-0 w-full h-[60px] bg-white flex items-center justify-between px-5">
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
        <h1 className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 font-[Pretendard] font-semibold text-[18px] leading-[29px] tracking-[-0.2px] text-[#1E2124]">
          내 정보 조회
        </h1>

        {/* 우측 상단 Group2085664926 아이콘 */}
        <button
          className="w-6 h-6 flex items-center justify-center z-[1]"
          type="button"
          onClick={handleGoToEdit}
        >
          <Icon
            icon="majesticons:edit-pen-2-line"
            className="w-6 h-6 text-[#1E2124]"
          />
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[60px] w-full px-5">
        <div className="w-full flex flex-col items-start gap-[30px] mt-[30px]">
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
              {/* 제목 + 수정버튼 */}
              <div className="w-full flex flex-row items-center justify-between">
                <span className="font-[Pretendard] text-[16px] leading-[26px] tracking-[-0.2px] text-black">
                  회원정보
                </span>

                <button
                  className="flex flex-row items-center gap-1"
                  type="button"
                  onClick={handleGoToEdit}
                >
                  <span className="font-[Pretendard] text-[12px] leading-[18px] tracking-[-0.1px] text-[#4170FF]">
                    회원 정보 수정
                  </span>
                  <Icon
                    icon="solar:alt-arrow-left-linear"
                    className="w-4 h-4 text-[#4170FF] rotate-180"
                  />
                </button>
              </div>

              <div className="w-full border-t border-[#D9D9D9]" />

              {/* 1열(라벨) + 2열(값) 두 칼럼 정렬 */}
              <div className="w-full flex flex-col items-start gap-3">
                {/* 고객명 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    고객명
                  </span>
                  <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black ml-3">
                    {customerData?.name || "홍종민"}
                  </span>
                </div>

                {/* 전화번호 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    전화번호
                  </span>
                  <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black ml-3">
                    {customerData?.phoneNumber || "010-1234-5678"}
                  </span>
                </div>

                {/* 이메일 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    이메일
                  </span>
                  <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black ml-3">
                    {customerData?.email || "이메일"}
                  </span>
                </div>

                {/* 주소 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    주소
                  </span>
                  <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black ml-3">
                    {customerData?.address || "주소"}
                  </span>
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
                {/* 예식일 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    예식일
                  </span>
                  <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black ml-3">
                    {customerData?.weddingDate || "예식일"}
                  </span>
                </div>

                {/* 예식 장소 */}
                <div className="w-full flex flex-row items-center">
                  <span className="w-[72px] text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
                    예식 장소
                  </span>
                  <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black ml-3">
                    {weddingPlace}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 회원 탈퇴 */}
        <div className="w-full flex justify-end mt-10 mb-10">
          <button
            className="text-[14px] text-[#999999]"
            type="button"
            onClick={handleOpenWithdrawModal}
          >
            회원 탈퇴
          </button>
        </div>
      </div>

      {/* 회원 탈퇴 확인 모달 */}
      {showWithdrawModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[310px] rounded-2xl bg-white px-5 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
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
    </div>
  );
};

export default MobileView;
