import React, { useState } from "react";
import { Icon } from "@iconify/react";

type TabType = "all" | "coupon" | "refund" | "payment" | "inquiry";

interface NotificationItem {
  id: number;
  type: TabType;
  title: string;
  time: string;
  unread?: boolean;
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: "refund",
    title: "‘환불 요청' 승인이 완료되었어요.",
    time: "1일 전",
    unread: true,
  },
  {
    id: 2,
    type: "inquiry",
    title: "문의 답변이 완료되었어요.",
    time: "1일 전",
  },
  {
    id: 3,
    type: "refund",
    title: "‘환불 요청' 승인이 완료되었어요.",
    time: "1일 전",
  },
  {
    id: 4,
    type: "payment",
    title: "결제 내역이 정상적으로 등록되었어요.",
    time: "2일 전",
  },
  {
    id: 5,
    type: "coupon",
    title: "신규 쿠폰이 발급되었어요.",
    time: "3일 전",
  },
];

const TAB_CONFIG: { key: TabType; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "coupon", label: "쿠폰" },
  { key: "refund", label: "환불내역" },
  { key: "payment", label: "결제내역" },
  { key: "inquiry", label: "문의내역" },
];

const filterByTab = (tab: TabType, list: NotificationItem[]) => {
  if (tab === "all") return list;
  return list.filter((item) => item.type === tab);
};

const WebView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const filtered = filterByTab(activeTab, NOTIFICATIONS);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex justify-center">
      <div className="w-full max-w-5xl flex gap-8 px-8 py-10">
        {/* 좌측 영역 */}
        <aside className="w-[220px]">
          <h1 className="text-[26px] font-semibold text-black mb-3">알림</h1>
          <p className="text-[14px] text-[#777777] leading-relaxed">
            주문, 환불, 결제, 문의, 쿠폰 관련 주요 알림을 한 곳에서 확인하세요.
          </p>
        </aside>

        {/* 우측 컨텐츠 */}
        <main className="flex-1">
          {/* 탭 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {TAB_CONFIG.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-full text-[14px] tracking-[-0.2px] ${
                    isActive
                      ? "bg-black text-white"
                      : "bg-white border border-[#D9D9D9] text-black"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 전체 개수 + 전체 읽음 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] text-black">
              전체 {filtered.length}개
            </span>
            <button
              type="button"
              className="flex items-center gap-1 text-[12px] text-[#999999]"
            >
              <Icon icon="solar:check-read-outline" className="w-4 h-4" />
              전체 읽음 처리
            </button>
          </div>

          {/* 리스트 */}
          <div className="flex flex-col gap-3">
            {filtered.length === 0 && (
              <div className="w-full h-[160px] flex flex-col items-center justify-center text-[#999999] text-[14px] bg-white rounded-[12px] border border-[#F0F0F0]">
                <Icon
                  icon="solar:bell-off-broken"
                  className="w-8 h-8 mb-2 opacity-70"
                />
                <span>선택한 카테고리에 알림이 없습니다.</span>
              </div>
            )}

            {filtered.map((item) => (
              <div
                key={item.id}
                className={`w-full bg-white border border-[#F0F0F0] rounded-[12px] px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-shadow ${
                  item.unread ? "ring-1 ring-[#F11F2F]/10" : ""
                }`}
              >
                <div className="w-11 h-11 rounded-[8px] bg-[#F4F4F4] flex items-center justify-center">
                  <Icon
                    icon="solar:bell-bing-bold-duotone"
                    className="w-6 h-6"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-[rgba(0,0,0,0.85)]">
                      {item.title}
                    </p>
                    {item.unread && (
                      <span className="inline-block w-2 h-2 rounded-full bg-[#F11F2F]" />
                    )}
                  </div>
                  <p className="text-[12px] text-[#999999]">{item.time}</p>
                </div>
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center text-[#C0C0C0] hover:text-black"
                >
                  <Icon
                    icon="solar:arrow-right-up-linear"
                    className="w-4 h-4"
                  />
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default WebView;
