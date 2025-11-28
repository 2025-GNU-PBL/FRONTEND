import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import type { CustomerData } from "../../../../../store/userSlice";
import api from "../../../../../lib/api/axios";
import { useRefreshAuth } from "../../../../../hooks/useRefreshAuth";
import { toast } from "react-toastify";

/** 공용 카드 컴포넌트 (웹 전용 스타일 - OWNER 디자인 기반) */
function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white/95 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          {icon ? (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/5">
              <Icon icon={icon} className="w-5 h-5 text-[#1E2124]" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold tracking-[-0.3px] text-gray-900 truncate">
              {title}
            </h3>
            {subtitle ? (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="px-6">
        <div className="h-px bg-gray-100" />
      </div>
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}

/** 모바일 InfoRow와 동일하게 value 없으면 "-" 처리 */
function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  const display = value && value.trim() !== "" ? value : "-";

  return (
    <div className="grid grid-cols-[140px_1fr] items-center py-3">
      <div className="text-sm text-gray-500 tracking-[-0.2px]">{label}</div>
      <div
        className={`text-sm text-gray-900 tracking-[-0.2px] break-words ${
          mono ? "font-mono" : ""
        }`}
      >
        {display}
      </div>
    </div>
  );
}

/** 고객(CUSTOMER) 마이페이지 - 내 정보 조회 (Web) */
const WebView: React.FC = () => {
  const nav = useNavigate();
  const { userData, role } = useAppSelector((state) => state.user);
  const { refreshAuth } = useRefreshAuth();

  // CUSTOMER만 허용 (OWNER ensureOwner 패턴 그대로 개념 적용)
  const customer = (
    role === "CUSTOMER" && userData
      ? (userData as CustomerData & {
          profileImage?: string;
          createdAt?: string;
        })
      : null
  ) as
    | (CustomerData & {
        profileImage?: string;
        createdAt?: string;
      })
    | null;

  // 회원 탈퇴 모달
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);

  const handleGoEdit = () => {
    nav("/my-page/client/profile/edit");
  };

  const handleOpenWithdrawModal = () => {
    setShowWithdrawModal(true);
  };

  const handleCancelWithdraw = () => {
    setShowWithdrawModal(false);
  };

  const handleConfirmWithdraw = async () => {
    try {
      await api.delete("/api/v1/customer");
      refreshAuth();
      toast.success("회원 탈퇴가 완료되었습니다.");
      nav("/");
    } catch (error) {
      console.error("회원 탈퇴 요청 중 에러 발생:", error);
      toast.error(
        "회원 탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      setShowWithdrawModal(false);
    }
  };

  // 비로그인/권한 불일치 처리 (OWNER 문구 기반 + 고객용 카피)
  if (!customer) {
    return (
      <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col mt-15">
        <div className="pt-16 pb-16">
          <div className="max-w-[960px] mx-auto px-6">
            <SectionCard
              title="접근 불가"
              subtitle="고객 계정으로 로그인 후 이용해 주세요."
              icon="solar:shield-warning-bold-duotone"
            >
              <div className="px-2 py-8 text-center text-sm text-gray-500">
                고객 정보가 없습니다. 다시 로그인해주세요.
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    );
  }

  // 모바일 뷰와 동일 필드 기준
  const {
    name,
    email,
    phoneNumber,
    address,
    profileImage,
    weddingDate,
    weddingSido,
    weddingSigungu,
  } = customer;

  const displayPhone = phoneNumber || "-";

  const weddingPlace =
    weddingSido && weddingSigungu
      ? `${weddingSido} ${weddingSigungu}`
      : address || "";

  const displayWeddingPlace =
    weddingPlace && weddingPlace.trim() !== ""
      ? weddingPlace
      : "예식 장소 미정";

  return (
    <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col mt-15">
      <div className="pt-16 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 상단 프로필 카드 (OWNER 디자인 + 파란 톤) */}
          <section className="relative rounded-3xl border border-gray-200 bg-white/95 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="absolute inset-0 -z-10 blur-xl rounded-3xl bg-gradient-to-br from-[#4170FF]/18 via-white to-[#111827]/6" />
            <div className="px-6 py-6">
              <div className="flex items-center gap-5">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="프로필 이미지"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <Icon
                      icon="solar:user-bold-duotone"
                      className="w-7 h-7 text-gray-500"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[20px] font-semibold text-gray-900 tracking-[-0.2px] truncate">
                    {name || "고객님"}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 tracking-[-0.2px]">
                    오늘도 좋은 하루 보내세요 👋
                  </div>
                </div>
                <div className="ml-auto hidden sm:flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#4170FF]/10 text-[#3051D8] ring-1 ring-[#4170FF]/20">
                    <Icon
                      icon="solar:check-circle-bold"
                      className="w-3.5 h-3.5"
                    />
                    CUSTOMER
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 회원정보 카드 (OWNER 카드 구조) */}
          <SectionCard
            title="회원정보"
            subtitle="계정 기본 정보"
            icon="solar:card-2-bold-duotone"
          >
            <div className="divide-y divide-gray-100">
              <InfoRow label="이름" value={name} />
              <InfoRow label="전화번호" value={displayPhone} />
              <InfoRow label="이메일" value={email} />
              <InfoRow label="주소" value={address} />
            </div>
          </SectionCard>

          {/* 예식 정보 카드 (OWNER 사업자 카드 자리에 예식 정보) */}
          <SectionCard
            title="예식 정보"
            subtitle="예식 관련 기본 정보입니다"
            icon="hugeicons:wedding"
          >
            <div className="divide-y divide-gray-100">
              <InfoRow label="예식일" value={weddingDate} />
              <InfoRow label="예식 장소" value={displayWeddingPlace} />
            </div>
          </SectionCard>

          {/* 하단 액션 (OWNER 하단 액션 디자인 + 파란 포인트) */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#4170FF] hover:text-[#3051D8] px-2 py-1"
              onClick={handleGoEdit}
            >
              <Icon icon="solar:pen-bold-duotone" className="w-4 h-4" />
              수정하기
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600 px-2 py-1"
              onClick={handleOpenWithdrawModal}
            >
              <Icon icon="solar:logout-2-bold-duotone" className="w-4 h-4" />
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>

      {/* 회원 탈퇴 확인 모달 (기존 고객 로직 그대로) */}
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
