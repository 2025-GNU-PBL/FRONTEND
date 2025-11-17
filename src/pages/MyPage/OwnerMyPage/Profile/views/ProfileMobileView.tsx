import React from "react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";
import { useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full rounded-2xl bg-white border border-gray-200 shadow-sm p-5 mb-3 last:mb-0">
      <h3 className="text-[16px] font-semibold text-gray-900 tracking-[-0.2px]">
        {title}
      </h3>
      <div className="my-4 h-px bg-[#D9D9D9]" />
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[14px] text-[#999] tracking-[-0.2px]">{label}</span>
      <span className="text-[14px] text-[#000] tracking-[-0.2px]">
        {value && value.trim() !== "" ? value : "-"}
      </span>
    </div>
  );
}

/** OWNER 유저만 허용 */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

/** 사장(OWNER) 마이페이지 - 내 정보 조회 (Mobile) */
export default function MobileView() {
  const nav = useNavigate();

  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  // 로그인 안 됐거나 OWNER가 아니면 안내
  if (!owner) {
    return (
      <div className="w-full bg-white">
        <div className="mx-auto w-[390px] h-[844px] bg-[#F6F7FB] flex flex-col">
          <div className="sticky top-0 z-20 bg-[#F6F7FB] border-b border-gray-200">
            <MyPageHeader
              title="내 정보 조회"
              onBack={() => nav(-1)}
              showMenu={false}
            />
          </div>
          <div className="flex-1 px-5 pt-20 flex items-center justify-center text-sm text-gray-500">
            사장님 정보가 없습니다. 다시 로그인해주세요.
          </div>
        </div>
      </div>
    );
  }

  // OwnerData 기준 필드
  const {
    name,
    email,
    phoneNumber,
    profileImage,
    bzNumber,
    bankAccount,
    bzName,
    detailAddress,
    createdAt,
  } = owner as OwnerData & {
    bzName?: string;
    detailAddress?: string;
  };

  const displayPhone = phoneNumber || "-";
  const displayCreatedAt = createdAt
    ? new Date(createdAt).toLocaleDateString("ko-KR")
    : "-";

  const handleGoEdit = () => {
    nav("/my-page/owner/profile/edit");
  };

  return (
    <div className="w-full bg-white">
      {/* 프레임 */}
      <div className="mx-auto w-[390px] h-[844px] bg-[#F6F7FB] flex flex-col">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-[#F6F7FB] border-b border-gray-200">
          <MyPageHeader
            title="내 정보 조회"
            onBack={() => nav(-1)}
            showMenu={false}
          />
        </div>

        {/* 본문 */}
        <div className="flex-1 px-5 pt-20 pb-24 overflow-auto space-y-6">
          {/* 상단 프로필 카드 */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-4">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="프로필 이미지"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#D9D9D9]" />
              )}
              <div>
                <div className="text-[18px] font-semibold text-black tracking-[-0.2px]">
                  {name}
                </div>
                <div className="text-sm text-gray-600 tracking-[-0.2px]">
                  사장님, 환영합니다 👋
                </div>
              </div>
            </div>
          </div>

          {/* 회원정보 (기본 정보) */}
          <SectionCard title="회원정보">
            <div className="space-y-2">
              <InfoRow label="이름" value={name} />
              <InfoRow label="전화번호" value={displayPhone} />
              <InfoRow label="이메일" value={email} />
              <InfoRow label="가입일" value={displayCreatedAt} />
            </div>
          </SectionCard>

          {/* 사업자 정보 */}
          <SectionCard title="사업자 정보">
            <div className="space-y-2">
              <InfoRow label="사업장명" value={bzName} />
              <InfoRow label="사업자 번호" value={bzNumber} />
              <InfoRow label="사업장 주소" value={detailAddress} />
              <InfoRow label="사업장 메일" value={email} />
              <InfoRow label="정산 계좌" value={bankAccount} />
            </div>
          </SectionCard>

          {/* 하단 액션 영역 */}
          <div className="mt-4 mb-2 flex items-center justify-between">
            <button
              type="button"
              className="text-[14px] text-[#FF2233] font-semibold hover:opacity-80"
              onClick={handleGoEdit}
            >
              수정하기
            </button>
            <button
              className="text-[14px] text-[#999] hover:text-[#666]"
              onClick={() => alert("회원 탈퇴 프로세스를 연결하세요.")}
            >
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
