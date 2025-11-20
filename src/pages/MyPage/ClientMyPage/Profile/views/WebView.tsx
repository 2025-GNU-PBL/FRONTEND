import React from "react";
import type { CustomerData, UserData } from "../../../../../store/userSlice";
import { useAppSelector } from "../../../../../store/hooks";

// 이 페이지는 "고객(CUSTOMER) 전용"이라는 전제를 코드로 한 번 잡아줌
function ensureCustomer(userData: UserData | null): CustomerData | null {
  if (!userData) return null;

  // CUSTOMER 전용 필드(weddingDate 등)가 있는지만 확인해서 좁혀줌
  if ("weddingDate" in userData) {
    return userData as CustomerData;
  }

  // OWNER 등이 들어오면 null 처리 (라우팅 잘 돼 있으면 실제로는 거의 안 옴)
  return null;
}

// 모바일과 동일한 카드/행 컴포넌트
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

export default function WebView() {
  // Redux에서 userData 가져오기
  const rawUserData = useAppSelector((state) => state.user.userData);
  const customer = ensureCustomer(rawUserData);

  // signupSlice 에 저장된 임시 회원가입 정보
  const signupValues = useAppSelector((state) => state.signup.values);

  // 로그인 안 됐거나, CUSTOMER 타입이 아니면 안내 문구 노출
  if (!customer) {
    return (
      <main className="w-full bg-[#F6F7FB] min-h-screen mt-15">
        <div className="pt-10 pb-16">
          <div className="max-w-[960px] mx-auto px-6">
            <section className="rounded-2xl bg-white/95 backdrop-blur border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
              <div className="px-6 py-10 flex items-center justify-center">
                <p className="text-sm text-gray-500">
                  고객 정보가 없습니다. 다시 로그인해주세요.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  // 여기부터는 CUSTOMER 전용 데이터만 사용
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
    <main className="w-full bg-[#F6F7FB] min-h-screen mt-15">
      <div className="pt-10 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 프로필 히어로 카드 */}
          <section className="rounded-2xl bg-white/95 backdrop-blur border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
            <div className="px-6 py-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300" />
                <div className="min-w-0">
                  <div className="text-[20px] font-semibold text-gray-900 tracking-[-0.2px] truncate">
                    {name}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 tracking-[-0.2px]">
                    반가워요! 오늘도 좋은 하루 👋
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 회원정보 카드 */}
          <SectionCard title="회원정보">
            <div className="divide-y divide-gray-100">
              <InfoRow label="고객명" value={name} />
              <div className="h-px bg-gray-100" />
              <InfoRow label="전화번호" value={displayPhone} />
              <div className="h-px bg-gray-100" />
              <InfoRow label="이메일" value={email} />
              <div className="h-px bg-gray-100" />
              <InfoRow label="주소" value={displayAddress} />
            </div>
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-gray-500"
                onClick={() => alert("회원 탈퇴 프로세스를 연결하세요.")}
              >
                회원 탈퇴
              </button>
            </div>
          </SectionCard>

          {/* 예식정보 카드 */}
          <SectionCard title="예식정보">
            <div className="divide-y divide-gray-100">
              <InfoRow label="예식일" value={displayWeddingDate} />
              <div className="h-px bg-gray-100" />
              <InfoRow label="예식장소" value={displayWeddingVenue} />
            </div>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
