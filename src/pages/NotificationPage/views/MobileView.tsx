import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { getAllNotifications } from "../../../lib/api/axios";
import { markNotificationAsRead } from "../../../lib/api/notification";
import type { Notification } from "../../../type/notification";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

interface MobileViewProps {
  liveNotifications: Notification[];
}

// 날짜 + 시간 포맷 함수 (WebView와 동일하게)
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

const MobileView: React.FC<MobileViewProps> = ({ liveNotifications }) => {
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
        setError("Failed to fetch notifications.");
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
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F8F8F8] text-[14px] text-[#555555]">
        알림을 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F8F8F8] text-[14px] text-[#F11F2F]">
        오류: {error}
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8F8F8] flex flex-col">
      <div className="w-full flex flex-col flex-1 mx-auto bg-[#F8F8F8]">
        <header className="h-16 px-5 flex items-center justify-between bg-[#F8F8F8] relative">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
          >
            <Icon icon="solar:alt-arrow-left-linear" className="w-8 h-8" />
          </button>

          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px] font-semibold text-black">
            알림
          </h1>

          <div className="w-8 h-8" />
        </header>

        <section className="mt-3 px-5">
          <p className="text-[14px] text-black">
            전체 {allNotifications.length}개
          </p>
        </section>

        <section className="mt-4 px-5 pb-6 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {allNotifications.map((notice) => {
              const { date, time } = formatNotificationDateTime(
                notice.createdAt
              );

              return (
                <div
                  key={notice.id}
                  onClick={() => handleNotificationClick(notice)}
                  className="relative w-full bg-white border border-[#F6F6F6] rounded-[12px] px-5 py-5 flex flex-col cursor-pointer"
                >
                  <div className="flex flex-row items-center gap-[18px]">
                    <div className="w-11 h-11 rounded-full bg-[#EDEDED] flex items-center justify-center shrink-0">
                      <Icon
                        icon={getNotificationIcon(notice.type)}
                        className="w-6 h-6 text-[#666666]"
                      />
                    </div>

                    <div className="flex flex-col justify-center flex-1">
                      <div className="flex flex-row items-start justify-between gap-2">
                        {/* 제목 */}
                        <p className="text-[14px] font-semibold text-black/80 text-left">
                          {notice.message}
                        </p>

                        {/* 날짜 + 시간 (웹뷰처럼 위/아래 배치) */}
                        <div className="flex flex-col items-end gap-0.5 ml-3 whitespace-nowrap">
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
                    </div>
                  </div>

                  {!notice.isRead && (
                    <span className="absolute w-2 h-2 rounded-full bg-[#F11F2F] right-5 top-3" />
                  )}
                </div>
              );
            })}

            {allNotifications.length === 0 && (
              <div className="w-full h-40 flex items-center justify-center text-[14px] text-[#999999]">
                표시할 알림이 없어요.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MobileView;
