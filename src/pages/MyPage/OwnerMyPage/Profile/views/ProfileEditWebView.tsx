import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";
import { updateOwnerInfo } from "../../../../../store/thunkFunctions";
import { useNavigate } from "react-router-dom";

/** OWNER 유저만 허용 */
function ensureOwner(userData: UserData | null): OwnerData | null {
  if (!userData) return null;
  if ("bzNumber" in userData && userData.userRole === "OWNER") {
    return userData as OwnerData;
  }
  return null;
}

/** 공용 카드 컴포넌트 */
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

/** 라벨 + 인풋 행 (웹 수정용) */
function EditableRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center py-3">
      <div className="text-sm text-gray-500 tracking-[-0.2px]">{label}</div>
      <div className="flex justify-end">
        <input
          className="w-full max-w-xs text-sm text-gray-900 tracking-[-0.2px] text-right border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF4646]/60 focus:border-transparent placeholder:text-gray-300 bg-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

/** 사장(OWNER) 마이페이지  */
export default function WebView() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 비로그인/권한 불일치 처리
  if (!owner) {
    return (
      <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
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

  // Redux에 이미 있는 owner 데이터 기준으로 초기값 세팅 (모바일과 동일)
  const {
    name,
    email,
    phoneNumber,
    profileImage,
    bzNumber,
    bankAccount,
    bzName,
    detailAddress,
  } = owner as OwnerData & {
    bzName?: string;
    detailAddress?: string;
  };

  // 최초 진입 시 owner 값으로 초기화
  const [memberName, setMemberName] = useState(name ?? "");
  const [memberPhone, setMemberPhone] = useState(phoneNumber ?? "");
  const [bizName, setBizName] = useState(bzName ?? "");
  const [bizNumber, setBizNumber] = useState(bzNumber ?? "");
  const [bizAddress, setBizAddress] = useState(detailAddress ?? "");
  const [bizEmail, setBizEmail] = useState(email ?? "");
  const [bizAccount, setBizAccount] = useState(bankAccount ?? "");

  // =============================
  //   회원 정보 수정 요청
  // =============================
  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      await dispatch(
        updateOwnerInfo({
          profileImage,
          phoneNumber: memberPhone,
          bzName: bizName,
          bzNumber: bizNumber,
          bankAccount: bizAccount,
          // 주소 관련 필드
          detailAddress: bizAddress,
          buildingName: "",
          zipCode: "",
          roadAddress: "",
          jibunAddress: "",
          // 이메일은 현재 Owner 수정 API 스펙에 없어서 여기선 전송하지 않음
        })
      ).unwrap();

      alert("회원 정보가 수정되었습니다.");
      nav(-1);
    } catch (error) {
      console.error(error);
      alert("정보 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#F6F7FB] text-gray-900 flex flex-col">
      {/* 상단 그라디언트 바 */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF6B6B] via-[#FF4646] to-[#FF2D55]" />

      <div className="pt-16 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 프로필 히어로 카드 */}
          <section className="relative rounded-3xl border border-gray-200 bg-white/95 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="absolute inset-0 -z-10 blur-xl rounded-3xl bg-gradient-to-br from-[#FF4646]/15 via-white to-[#111827]/5" />
            <div className="px-6 py-6 flex items-center gap-5">
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
              <div className="min-w-0 flex-1">
                <div className="text-[20px] font-semibold text-gray-900 tracking-[-0.2px] truncate">
                  {memberName || name}
                </div>
                <div className="mt-1 text-sm text-gray-600 tracking-[-0.2px]">
                  사장님, 환영합니다 👋
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#FF4646]/10 text-[#FF4646] ring-1 ring-[#FF4646]/20">
                  <Icon
                    icon="solar:check-circle-bold"
                    className="w-3.5 h-3.5"
                  />
                  OWNER
                </span>
              </div>
            </div>
          </section>

          {/* 회원정보 카드 (수정 가능) - 모바일과 동일 필드 */}
          <SectionCard
            title="회원정보"
            subtitle="계정 기본 정보를 수정할 수 있습니다"
            icon="solar:card-2-bold-duotone"
          >
            <div className="divide-y divide-gray-100">
              <EditableRow
                label="회원명"
                value={memberName}
                onChange={setMemberName}
                placeholder="이름을 입력하세요"
              />
              <EditableRow
                label="전화번호"
                value={memberPhone}
                onChange={setMemberPhone}
                placeholder="전화번호를 입력하세요"
              />
            </div>
          </SectionCard>

          {/* 사업자 정보 카드 (수정 가능) - 모바일과 동일 필드 구성 */}
          <SectionCard
            title="사업자 정보"
            subtitle="정산 및 세무에 활용되니 정확히 입력해주세요"
            icon="solar:shop-2-bold-duotone"
          >
            <div className="divide-y divide-gray-100">
              <EditableRow
                label="사업장명"
                value={bizName}
                onChange={setBizName}
                placeholder="사업장명을 입력하세요"
              />
              <EditableRow
                label="사업자 번호"
                value={bizNumber}
                onChange={setBizNumber}
                placeholder="숫자와 - 로 입력하세요"
              />
              <EditableRow
                label="사업장 주소"
                value={displayBzAddress}
                onChange={setBizAddress}
                placeholder="사업장 주소를 입력하세요"
              />
              <EditableRow
                label="사업장 메일"
                value={bizEmail}
                onChange={setBizEmail}
                placeholder="메일 주소를 입력하세요"
              />
              <EditableRow
                label="정산 계좌"
                value={bizAccount}
                onChange={setBizAccount}
                placeholder="은행명 + 계좌번호를 입력하세요"
              />
            </div>
          </SectionCard>

          {/* 하단 액션 */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#FF4646] hover:bg-[#FF2233] shadow-[0_10px_25px_rgba(255,70,70,0.35)] transition-all ${
                isSubmitting ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <Icon icon="solar:pen-bold-duotone" className="w-4 h-4" />
              {isSubmitting ? "수정 중..." : "정보 수정하기"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
