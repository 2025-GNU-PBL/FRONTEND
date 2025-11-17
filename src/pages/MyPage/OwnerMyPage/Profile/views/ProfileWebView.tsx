import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";

/** OWNER 유저만 허용 (모바일과 동일 조건) */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

/** 공용 카드 컴포넌트 (웹 전용 스타일) */
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

/** 사장(OWNER) 마이페이지 - 내 정보 조회 (Web) */
export default function WebView() {
  const nav = useNavigate();
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const handleGoEdit = () => {
    nav("/my-page/owner/profile/edit");
  };

  // 비로그인/권한 불일치 처리 (모바일 문구와 통일)
  if (!owner) {
    return (
      <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
        {/* 상단 그라디언트 바 */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />
        <div className="pt-16 pb-16">
          <div className="max-w-[960px] mx-auto px-6">
            <SectionCard
              title="접근 불가"
              subtitle="사장님 계정으로 로그인 후 이용해 주세요."
              icon="solar:shield-warning-bold-duotone"
            >
              <div className="px-2 py-8 text-center text-sm text-gray-500">
                사장님 정보가 없습니다. 다시 로그인해주세요.
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    );
  }

  // 모바일 뷰와 동일 필드 기준으로 추출
  const {
    name,
    email,
    phoneNumber,
    profileImage,
    bzNumber,
    bankAccount,
    bzName,
    roadAddress,
    jibunAddress,
    detailAddress,
    buildingName,
    createdAt,
  } = owner as OwnerData & {
    bzName?: string;
    detailAddress?: string;
    roadAddress?: string;
    jibunAddress?: string;
    buildingName?: string;
  };

  // 모바일과 동일 의미의 display 값들
  const displayPhone = phoneNumber || "-";
  const displayCreatedAt = createdAt
    ? new Date(createdAt).toLocaleDateString("ko-KR")
    : "-";

  // 모바일과 동일한 주소 가공 로직
  const displayBzAddress = (() => {
    const baseAddress = roadAddress || jibunAddress || "";
    const parts: string[] = [];

    if (baseAddress) parts.push(baseAddress);
    if (detailAddress) parts.push(detailAddress);
    const addressStr = parts.join(" ");

    if (buildingName) {
      return addressStr
        ? `${addressStr} (${buildingName})`
        : `(${buildingName})`;
    }

    return addressStr;
  })();

  return (
    <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
      {/* 상단 그라디언트 바 */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <div className="pt-16 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 상단 프로필 카드  */}
          <section className="relative rounded-3xl border border-gray-200 bg-white/95 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="absolute inset-0 -z-10 blur-xl rounded-3xl bg-gradient-to-br from-[#FF4646]/15 via-white to-[#111827]/5" />
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
                    {name}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 tracking-[-0.2px]">
                    사장님, 환영합니다 👋
                  </div>
                </div>
                <div className="ml-auto hidden sm:flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#FF4646]/10 text-[#FF4646] ring-1 ring-[#FF4646]/20">
                    <Icon
                      icon="solar:check-circle-bold"
                      className="w-3.5 h-3.5"
                    />
                    OWNER
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 회원정보 카드  */}
          <SectionCard
            title="회원정보"
            subtitle="계정 기본 정보"
            icon="solar:card-2-bold-duotone"
          >
            <div className="divide-y divide-gray-100">
              <InfoRow label="이름" value={name} />
              <InfoRow label="전화번호" value={displayPhone} />
              <InfoRow label="이메일" value={email} />
              <InfoRow label="가입일" value={displayCreatedAt} />
            </div>
          </SectionCard>

          {/* 사업자 정보 카드 */}
          <SectionCard
            title="사업자 정보"
            subtitle="정산 및 세무에 활용됩니다"
            icon="solar:shop-2-bold-duotone"
          >
            <div className="divide-y divide-gray-100">
              <InfoRow label="사업장명" value={bzName} />
              <InfoRow label="사업자 번호" value={bzNumber} />
              <InfoRow label="사업장 주소" value={displayBzAddress} />
              <InfoRow label="사업장 메일" value={email} />
              <InfoRow label="정산 계좌" value={bankAccount} />
            </div>
          </SectionCard>

          {/* 하단 액션 */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF4646] hover:text-[#FF2233] px-2 py-1"
              onClick={handleGoEdit}
            >
              <Icon icon="solar:pen-bold-duotone" className="w-4 h-4" />
              수정하기
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-600 px-2 py-1"
              onClick={() => alert("회원 탈퇴 프로세스를 연결하세요.")}
            >
              <Icon icon="solar:logout-2-bold-duotone" className="w-4 h-4" />
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
