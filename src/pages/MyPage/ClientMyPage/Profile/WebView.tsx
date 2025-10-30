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

export default function WebView() {
  const p = getProfile();

  return (
    <main className="w-full bg-[#F6F7FB] min-h-screen pt-40">
      <div className="pt-10 pb-16">
        {/* Rail (inline) */}
        <div className="max-w-[960px] mx-auto px-6">
          {/* 프로필 히어로 카드 (inline Card) */}
          <section className="mb-8 rounded-2xl bg-white/95 backdrop-blur border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
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

          {/* 회원정보 카드 (inline Card + SectionHeader + KeyValue) */}
          <section className="rounded-2xl bg-white/95 backdrop-blur border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h3 className="text-[18px] font-semibold tracking-[-0.3px] text-gray-900">
                회원정보
              </h3>
              <button
                type="button"
                className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
                onClick={() => alert("내 정보 수정 화면으로 이동")}
              >
                정보 수정
              </button>
            </div>
            {/* Divider */}
            <div className="px-6">
              <div className="h-px bg-gray-100" />
            </div>

            {/* Key-Value 리스트 */}
            <div className="py-1">
              <div className="grid grid-cols-[140px_1fr] items-center px-6 py-3 border-b border-gray-100">
                <div className="text-sm text-gray-500 tracking-[-0.2px]">
                  고객명
                </div>
                <div className="text-sm text-gray-900 tracking-[-0.2px] break-words">
                  {p.name ?? "-"}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center px-6 py-3 border-b border-gray-100">
                <div className="text-sm text-gray-500 tracking-[-0.2px]">
                  전화번호
                </div>
                <div className="text-sm text-gray-900 tracking-[-0.2px] break-words">
                  {p.phone ?? "-"}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center px-6 py-3 border-b border-gray-100">
                <div className="text-sm text-gray-500 tracking-[-0.2px]">
                  이메일
                </div>
                <div className="text-sm text-gray-900 tracking-[-0.2px] break-words">
                  {p.email ?? "-"}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center px-6 py-3">
                <div className="text-sm text-gray-500 tracking-[-0.2px]">
                  주소
                </div>
                <div className="text-sm text-gray-900 tracking-[-0.2px] break-words">
                  {p.address ?? "-"}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 pt-4 pb-6 flex justify-end">
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-gray-500"
                onClick={() => alert("회원 탈퇴 프로세스를 연결하세요.")}
              >
                회원 탈퇴
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
