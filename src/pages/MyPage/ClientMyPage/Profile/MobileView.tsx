import React from "react";

type Profile = {
  name: string;
  phone: string;
  email: string;
  address?: string;
};

const getProfile = (): Profile => ({
  name: localStorage.getItem("userName") || "홍종민",
  phone: localStorage.getItem("userPhone") || "010-1234-5678",
  email: localStorage.getItem("userEmail") || "email@example.com",
  address: localStorage.getItem("userAddress") || "서울특별시 어딘가",
});

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
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

/** 아이폰 12 Pro 고정 레이아웃(390×844), 스크롤 없이 푸터까지 노출 */
export default function MobileView() {
  const p = getProfile();

  return (
    <main className="w-full pt-40">
      {/* === 뷰포트 고정: 390 x 844 === */}
      <div className="mx-auto w-[390px] h-[844px] bg-[#F6F7FB] flex flex-col">
        {/* 상단 프로필 카드 (고정 높이 아님, 내용만큼) */}
        <div className="px-5 pt-6">
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
        </div>

        {/* 본문(남는 높이 채우기) */}
        <div className="flex-1 px-5 pt-5 pb-0 overflow-hidden">
          <SectionCard title="회원정보">
            <div className="space-y-2">
              <InfoRow label="고객명" value={p.name} />
              <InfoRow label="전화번호" value={p.phone} />
              <InfoRow label="이메일" value={p.email} />
              <InfoRow label="주소" value={p.address} />
            </div>
          </SectionCard>

          {/* 우측 하단 ‘회원 탈퇴’ 위치 맞춤 */}
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
    </main>
  );
}
