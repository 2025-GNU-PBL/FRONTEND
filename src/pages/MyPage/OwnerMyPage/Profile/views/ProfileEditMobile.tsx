import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import type { OwnerData, UserData } from "../../../../../store/userSlice";
import { updateOwnerInfo } from "../../../../../store/thunkFunctions";

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full rounded-2xl bg-white border border-gray-200 shadow-sm p-5 mb-6 last:mb-0">
      <h3 className="text-[16px] font-semibold text-gray-900 tracking-[-0.2px]">
        {title}
      </h3>
      <div className="my-4 h-px bg-[#D9D9D9]" />
      {children}
    </section>
  );
}

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
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[14px] text-[#999999] tracking-[-0.2px]">
        {label}
      </span>
      <input
        className="ml-6 flex-1 text-right text-[14px] text-[#000000] tracking-[-0.2px] bg-transparent outline-none placeholder:text-[#CCCCCC]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
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

/** 사장(OWNER) 마이페이지 - 회원 정보 수정 (Mobile) */
export default function MobileView() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();

  const rawUserData = useAppSelector((state) => state.user.userData);
  const owner = ensureOwner(rawUserData);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // OWNER가 아니거나 로그인 안 된 경우
  if (!owner) {
    return (
      <div className="w-full bg-white">
        <div className="mx-auto w-[390px] h-[844px] bg-[#F6F7FB] flex flex-col">
          <div className="sticky top-0 z-20 bg-[#F6F7FB] border-b border-gray-200">
            <MyPageHeader
              title="회원 정보 수정"
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

  // Redux에 이미 있는 owner 데이터 기준으로 초기값 세팅
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
    <div className="w-full bg-white">
      <div className="relative mx-auto w-[390px] h-[844px] bg-[#F6F7FB] flex flex-col">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-[#F6F7FB] border-b border-gray-200">
          <MyPageHeader
            title="회원 정보 수정"
            onBack={() => nav(-1)}
            showMenu={false}
          />
        </div>

        {/* 본문 */}
        <div className="flex-1 px-5 pt-20 pb-28 overflow-auto space-y-6">
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
              <span className="text-[18px] font-semibold">
                {memberName || name}
              </span>
            </div>
          </div>

          {/* 회원정보 섹션 */}
          <SectionCard title="회원정보">
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
          </SectionCard>

          {/* 사업자 정보 섹션 (조회 페이지와 동일 항목) */}
          <SectionCard title="사업자 정보">
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
              value={bizAddress}
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
          </SectionCard>
        </div>

        {/* 하단 고정 버튼 */}
        <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-5 pb-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`pointer-events-auto w-full h-14 rounded-xl bg-[#FF2233] text-white text-[16px] font-semibold ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "수정 중..." : "수정하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
