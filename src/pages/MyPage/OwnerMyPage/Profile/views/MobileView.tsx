import React from "react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";
import { useAppSelector } from "../../../../../store/hooks";
import type { CustomerData, UserData } from "../../../../../store/userSlice";

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

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[14px] text-[#999] tracking-[-0.2px]">{label}</span>
      <span className="text-[14px] text-[#000] tracking-[-0.2px]">
        {value ?? "-"}
      </span>
    </div>
  );
}

// 이 페이지는 "고객(CUSTOMER) 전용"이라는 전제를 코드로 한 번 잡아줌
function ensureCustomer(userData: UserData | null): CustomerData | null {
  if (!userData) return null;

  // UserData 타입에서 Customer를 판단할 가장 확실한 기준 필드를 사용
  if ("weddingDate" in userData) {
    return userData as CustomerData;
  }

  // OWNER 등 다른 타입이면 null 처리
  return null;
}

/** 고정 레이아웃(390×844) - 고객 마이페이지 */
export default function MobileView() {
  const nav = useNavigate();

  const rawUserData = useAppSelector((state) => state.user.userData);
  const customer = ensureCustomer(rawUserData);

  // signupSlice 에 저장된 임시 회원가입 정보
  const signupValues = useAppSelector((state) => state.signup.values);

  // 로그인 안 됐거나, CUSTOMER가 아닌 경우 예외 처리
  if (!customer) {
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
            고객 정보가 없습니다. 다시 로그인해주세요.
          </div>
        </div>
      </div>
    );
  }

  // 여기부터는 무조건 CustomerData라고 보고 사용하면 됨
  const {
    name,
    phoneNumber,
    email,
    roadAddress,
    jibunAddress,
    address,
    sido,
    sigungu,
    dong,
    buildingName,
    weddingDate,
    weddingSido,
    weddingSigungu,
  } = customer;

  // 전화번호: 고객 정보 → 없으면 signupSlice 값
  const displayPhone = phoneNumber || signupValues.phone || "-";

  // 주소: 고객 주소 → 없으면 signupSlice 주소
  const displayAddress =
    roadAddress ||
    jibunAddress ||
    address ||
    [sido, sigungu, dong, buildingName].filter(Boolean).join(" ") ||
    signupValues.roadAddress ||
    signupValues.jibunAddress ||
    signupValues.address ||
    [
      signupValues.sido,
      signupValues.sigungu,
      signupValues.dong,
      signupValues.buildingName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "-";

  // 예식일: 고객 예식일 → 없으면 signupSlice 예식일
  const rawWeddingDate = weddingDate || signupValues.weddingDate;
  const displayWeddingDate = rawWeddingDate
    ? new Date(rawWeddingDate).toLocaleDateString("ko-KR")
    : "-";

  // 예식장소: 고객 예식 장소 정보 → 없으면 signupSlice 예식 장소 정보
  const displayWeddingVenue =
    buildingName ||
    [weddingSido, weddingSigungu].filter(Boolean).join(" ") ||
    signupValues.buildingName ||
    [signupValues.weddingSido, signupValues.weddingSigungu]
      .filter(Boolean)
      .join(" ") ||
    "-";

  return (
    <div className="w-full bg-white">
      {/* 프레임 하나로 통일 (헤더 + 본문) */}
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
        <div className="flex-1 px-5 pt-20 pb-0 overflow-auto space-y-6">
          {/* 상단 프로필 카드 */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#D9D9D9]" />
              <div>
                <div className="text-[18px] font-semibold text-black tracking-[-0.2px]">
                  {name}
                </div>
                <div className="text-sm text-gray-600 tracking-[-0.2px]">
                  반가워요! 오늘도 좋은 하루 👋
                </div>
              </div>
            </div>
          </div>

          {/* 회원정보 */}
          <SectionCard title="회원정보">
            <div className="space-y-2">
              <InfoRow label="고객명" value={name} />
              <InfoRow label="전화번호" value={displayPhone} />
              <InfoRow label="이메일" value={email} />
              <InfoRow label="주소" value={displayAddress} />
            </div>
          </SectionCard>

          {/* 예식정보 */}
          <SectionCard title="예식정보">
            <div className="space-y-2">
              <InfoRow label="예식일" value={displayWeddingDate} />
              <InfoRow label="예식장소" value={displayWeddingVenue} />
            </div>
          </SectionCard>

          {/* 회원 탈퇴 */}
          <div className="mt-4 flex">
            <button
              className="ml-auto text-[14px] text-[#999] hover:text-[#666]"
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
