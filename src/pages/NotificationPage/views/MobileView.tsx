import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

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
    type: "refund",
    title: "‘환불 요청' 승인이 완료되었어요.",
    time: "1일 전",
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

const MobileView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const navigate = useNavigate();

  const filtered = filterByTab(activeTab, NOTIFICATIONS);

  const getImageByType = (type: TabType) => {
    switch (type) {
      case "refund":
        return "/images/refund.png";
      case "inquiry":
        return "/images/inquiry.png";
      case "coupon":
        return "/images/coupon.png";
      case "payment":
        return "/images/payment.png";
      default:
        return "/images/default.png";
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F8F8] text-[#000000]">
      {/* 컨텐츠 래퍼: md 이하 전체 폭 사용 (상위에서 md:hidden 처리) */}
      <div className="w-full min-h-screen mx-auto">
        {/* 상단 헤더 */}
        <header className="w-full h-[60px] bg-[#F8F8F8] flex items-center px-5 relative">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center"
          >
            <Icon icon="solar:alt-arrow-left-linear" className="w-6 h-6" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 top-[15.5px] flex items-center justify-center">
            <span className="font-semibold text-[18px] leading-[160%] tracking-[-0.2px]">
              알림
            </span>
          </div>

          {/* 우측 빈 공간(정렬용) */}
          <div className="w-8 h-8" />
        </header>

        {/* 탭 영역 */}
        <div className="w-full px-5 mt-4 flex flex-row justify-center items-center gap-2 overflow-x-auto scrollbar-hide">
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.key;

            const baseClass =
              "flex flex-row justify-center items-center px-3 py-2 rounded-[20px] text-[14px] leading-[150%] tracking-[-0.2px] whitespace-nowrap";
            const activeClass = "bg-[#000000] text-[#FFFFFF]";
            const inactiveClass =
              "bg-[#FFFFFF] border border-[#D9D9D9] text-[#000000]";

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`${baseClass} ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 전체 개수 */}
        <div className="w-full px-5 mt-4">
          <span className="text-[14px] leading-[150%] tracking-[-0.2px]">
            전체 {filtered.length}개
          </span>
        </div>

        {/* 알림 리스트 */}
        <div className="w-full px-5 mt-3 pb-8 flex flex-col gap-4">
          {filtered.length === 0 && (
            <div className="w-full h-[120px] flex flex-col items-center justify-center text-[#999999] text-[14px]">
              <Icon
                icon="solar:bell-off-broken"
                className="w-8 h-8 mb-2 opacity-70"
              />
              <span>표시할 알림이 없습니다.</span>
            </div>
          )}

          {filtered.map((item) => (
            <div
              key={item.id}
              className="relative w-full min-h-[84px] bg-[#FFFFFF] border border-[#F6F6F6] rounded-[12px] px-5 py-4 flex flex-col"
            >
              <div className="flex flex-row items-center gap-[18px] w-full">
                {/* 타입별 이미지 */}
                <div
                  className="w-11 h-11 bg-cover bg-center rounded-[8px] shrink-0"
                  style={{
                    backgroundImage: `url(${getImageByType(item.type)})`,
                  }}
                />

                {/* 텍스트 영역 */}
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-[14px] leading-[150%] tracking-[-0.1px] text-[rgba(0,0,0,0.8)] line-clamp-2">
                    {item.title}
                  </span>
                  <span className="font-normal text-[12px] leading-[150%] tracking-[-0.1px] text-[#999999] mt-[2px]">
                    {item.time}
                  </span>
                </div>
              </div>

              {item.unread && (
                <span className="absolute w-2 h-2 rounded-full bg-[#F11F2F] right-3 top-3" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileView;
