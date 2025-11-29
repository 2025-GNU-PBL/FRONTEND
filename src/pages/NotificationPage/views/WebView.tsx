import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { getAllNotifications } from "../../../lib/api/axios";
import { markNotificationAsRead } from "../../../lib/api/notification";
import type { Notification } from "../../../type/notification";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

interface WebViewProps {
  liveNotifications: Notification[];
}

// 날짜 + 시간 포맷 함수
const formatNotificationDateTime = (createdAt?: string | Date) => {
  if (!createdAt) return { date: "", time: "" };

  const dateObj = new Date(createdAt);
  if (Number.isNaN(dateObj.getTime())) return { date: "", time: "" };

  const date = dateObj.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const time = dateObj.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { date, time };
};

const WebView: React.FC<WebViewProps> = ({ liveNotifications }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRole = useSelector((state: RootState) => state.user.role);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getAllNotifications();
        setNotifications(response.data as Notification[]);
      } catch (err) {
        setError("알림을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const allNotifications: Notification[] = Array.from(
    new Map(
      [...liveNotifications, ...notifications].map((notification) => [
        notification.id,
        notification,
      ])
    ).values()
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "RESERVATION_COMPLETED":
      case "RESERVATION_APPROVED":
        return "solar:check-circle-bold-duotone";
      case "PAYMENT":
      case "PAYMENT_REQUIRED":
      case "PAYMENT_COMPLETED":
        return "solar:card-bold-duotone";
      case "PAYMENT_CANCELED":
      case "PAYMENT_CANCEL_REQUEST":
        return "solar:close-circle-bold-duotone";
      case "COUPON":
        return "solar:discount-bold-duotone";
      case "INQUIRY_REPLY":
        return "solar:chat-square-question-bold-duotone";
      case "REFUND":
        return "solar:refresh-bold-duotone";
      default:
        return "solar:bell-bold-duotone";
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markNotificationAsRead(notification.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );

      if (notification.type === "PAYMENT_REQUIRED") {
        navigate("/checkout");
      } else if (
        userRole === "CUSTOMER" &&
        notification.type === "PAYMENT_COMPLETED"
      ) {
        navigate("/my-page/client/payments");
      } else if (
        userRole === "OWNER" &&
        notification.type === "PAYMENT_COMPLETED"
      ) {
        navigate("/my-page/owner/payments");
      } else if (
        userRole === "CUSTOMER" &&
        notification.type === "PAYMENT_CANCELED"
      ) {
        navigate("/my-page/client/payments");
      } else if (
        userRole === "OWNER" &&
        notification.type === "PAYMENT_CANCELED"
      ) {
        navigate("/my-page/owner/payments");
      } else if (
        userRole === "OWNER" &&
        notification.type === "PAYMENT_CANCEL_REQUEST"
      ) {
        navigate("/my-page/owner/cancels");
      } else if (
        userRole === "OWNER" &&
        notification.type === "RESERVATION_COMPLETED"
      ) {
        navigate("/my-page/owner/reservations");
      } else if (notification.type === "REFUND" && notification.actionUrl) {
        navigate(notification.actionUrl);
      } else if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    } catch (error) {
      console.error("Failed to mark notification as read or navigate:", error);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[14px] text-[#555555]">
          <Icon icon="solar:bell-bing-bold-duotone" className="w-9 h-9" />
          <p>알림을 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[14px] text-[#F11F2F]">
          <Icon icon="solar:danger-triangle-bold-duotone" className="w-9 h-9" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F3F4F6] flex flex-col mt-15">
      {/* 콘텐츠 영역 */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] min-h-[480px] flex flex-col">
            {/* 리스트 상단 영역 */}
            <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon
                  icon="solar:bell-bing-bold-duotone"
                  className="w-5 h-5 text-[#4B5563]"
                />
                <span className="text-[14px] text-[#4B5563]">
                  최근 알림 목록
                </span>
              </div>

              <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF]">
                <span className="w-1 h-1 rounded-full bg-[#10B981]" />
                <span>실시간 알림 포함</span>
              </div>
            </div>

            {/* 알림 리스트 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {allNotifications.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
                    <Icon
                      icon="solar:bell-off-bold-duotone"
                      className="w-8 h-8 text-[#D1D5DB]"
                    />
                  </div>
                  <p className="text-[15px] font-medium text-[#4B5563] mb-1">
                    표시할 알림이 없어요.
                  </p>
                  <p className="text-[13px] text-[#9CA3AF]">
                    새로운 알림이 도착하면 이곳에 표시됩니다.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[#F3F4F6]">
                  {allNotifications.map((notice) => {
                    const { date, time } = formatNotificationDateTime(
                      notice.createdAt
                    );

                    return (
                      <div
                        key={notice.id}
                        onClick={() => handleNotificationClick(notice)}
                        className="relative px-6 py-5 flex gap-4 cursor-pointer group hover:bg-[#F9FAFB] transition"
                      >
                        {/* 아이콘 */}
                        <div className="mt-1">
                          <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center group-hover:bg-[#E5E7EB] transition">
                            <Icon
                              icon={getNotificationIcon(notice.type)}
                              className="w-8 h-8 text-[#6B7280]"
                            />
                          </div>
                        </div>

                        {/* 내용 */}
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-start justify-between gap-4 mt-1">
                            <p className="text-[14px] font-semibold text-[#111827] leading-snug">
                              {notice.message}
                            </p>

                            {/* 날짜 + 시간 영역 */}
                            <div className="flex flex-col items-end gap-0.5 mt-0.5">
                              {date && (
                                <span className="text-[12px] text-[#192842] leading-none">
                                  {date}
                                </span>
                              )}
                              {time && (
                                <span className="text-[11px] text-[#6B7280] leading-none">
                                  {time}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 타입 뱃지 */}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] text-[11px] text-[#6B7280]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                              {notice.type}
                            </span>
                            {!notice.isRead && (
                              <span className="text-[11px] text-[#F11F2F] font-medium">
                                안 읽은 알림
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 읽지 않음 점 표시 */}
                        {!notice.isRead && (
                          <span className="absolute right-6 top-2/3 -translate-y-1/2 w-2 h-2 rounded-full bg-[#F11F2F]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WebView;
