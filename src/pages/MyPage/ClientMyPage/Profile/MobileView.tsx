import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../../../components/clientMypage/MyPageHeader";

type Profile = {
  name: string;
  phone: string;
  email: string;
  address: string;
  weddingDate: Date;
  weddingVenue: string;
};

const getProfile = (): Profile => ({
  name: localStorage.getItem("userName") || "홍종민",
  phone: localStorage.getItem("userPhone") || "010-1234-5678",
  email: localStorage.getItem("userEmail") || "email@example.com",
  address: localStorage.getItem("userAddress") || "서울특별시 어딘가",
  weddingDate: localStorage.getItem("userWeddingDate")
    ? new Date(localStorage.getItem("userWeddingDate") as string)
    : new Date("2025-11-01"),
  weddingVenue:
    localStorage.getItem("userWeddingVenue") || "서울 더클래스청담 그랜드홀",
});

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

/** 고정 레이아웃(390×844)*/
export default function MobileView() {
  const p = getProfile();
  const nav = useNavigate();

  return (
    <div className="w-full bg-white">
      {/* 프레임 하나로 통일 (헤더 + 본문) */}
      <div className="mx-auto w-[390px] h-[844px] bg-[#F6F7FB] flex flex-col">
        {/* 헤더: '내 정보 조회'에서는 메뉴 숨김 */}
        <div className="sticky top-0 z-20 bg-[#F6F7FB] border-b border-gray-200">
          <MyPageHeader
            title="내 정보 조회"
            onBack={() => nav(-1)}
            showMenu={false}
          />
        </div>

        {/* 본문 */}
        <div className="flex-1 px-5 pt-6 pb-0 overflow-auto space-y-6">
          {/* 상단 프로필 카드 */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#D9D9D9]" />
              <div>
                <div className="text-[18px] font-semibold text-black tracking-[-0.2px]">
                  {p.name}
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
              <InfoRow label="고객명" value={p.name} />
              <InfoRow label="전화번호" value={p.phone} />
              <InfoRow label="이메일" value={p.email} />
              <InfoRow label="주소" value={p.address} />
            </div>
          </SectionCard>

          {/* 예식정보*/}
          <SectionCard title="예식정보">
            <div className="space-y-2">
              <InfoRow
                label="예식일"
                value={p.weddingDate.toLocaleDateString("ko-KR")}
              />
              <InfoRow label="예식장소" value={p.weddingVenue} />
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
