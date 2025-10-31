import React from "react";

type Profile = {
  name: string;
  phone: string;
  email: string;
  address?: string;
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
  const p = getProfile();

  return (
    <main className="w-full bg-[#F6F7FB] min-h-screen mt-15">
      <div className="pt-10 pb-16">
        <div className="max-w-[960px] mx-auto px-6 space-y-8">
          {/* 프로필 히어로 카드 (모바일 상단 프로필 카드와 동일 역할) */}
          <section className="rounded-2xl bg-white/95 backdrop-blur border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
            <div className="px-6 py-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300" />
                <div className="min-w-0">
                  <div className="text-[20px] font-semibold text-gray-900 tracking-[-0.2px] truncate">
                    {p.name}
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
              <InfoRow label="고객명" value={p.name} />
              <div className="h-px bg-gray-100" />
              <InfoRow label="전화번호" value={p.phone} />
              <div className="h-px bg-gray-100" />
              <InfoRow label="이메일" value={p.email} />
              <div className="h-px bg-gray-100" />
              <InfoRow label="주소" value={p.address} />
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

          {/* 예식정보 카드 (모바일 예식정보 섹션 매칭) */}
          <SectionCard title="예식정보">
            <div className="divide-y divide-gray-100">
              <InfoRow
                label="예식일"
                value={p.weddingDate.toLocaleDateString("ko-KR")}
              />
              <div className="h-px bg-gray-100" />
              <InfoRow label="예식장소" value={p.weddingVenue} />
            </div>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
