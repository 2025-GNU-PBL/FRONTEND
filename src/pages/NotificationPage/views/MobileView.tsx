import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MobileView.css";
import { getAllNotifications } from "../../../lib/api/axios";
import { markNotificationAsRead } from "../../../lib/api/notification";
import type { Notification } from "../../../type/notification";

interface MobileViewProps {
  liveNotifications: Notification[];
}

const MobileView: React.FC<MobileViewProps> = ({ liveNotifications }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("전체");

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

  const allNotifications = [...liveNotifications, ...notifications];

  const filteredNotifications = allNotifications.filter((notification) => {
    if (activeFilter === "전체") return true;
    if (activeFilter === "쿠폰" && notification.type === "COUPON") return true;
    if (activeFilter === "환불내역" && notification.type === "REFUND")
      return true;
    if (activeFilter === "결제내역" && notification.type === "PAYMENT")
      return true;
    if (activeFilter === "문의내역" && notification.type === "INQUIRY_REPLY")
      return true;
    return false;
  });

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markNotificationAsRead(notification.id);

      // 로컬 상태에서 읽음 처리
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );

      // 알림 타입에 따른 라우팅
      if (notification.type === "PAYMENT_REQUIRED") {
        // 결제 요청 알림
        navigate("/checkout");
      } else if (notification.type === "REFUND" && notification.actionUrl) {
        // 환불 관련 알림 → 백엔드에서 내려준 환불 요청/내역 페이지로 이동
        navigate(notification.actionUrl);
      } else if (notification.actionUrl) {
        // 그 외: actionUrl 이 있으면 공통 처리
        navigate(notification.actionUrl);
      }
    } catch (error) {
      console.error("Failed to mark notification as read or navigate:", error);
    }
  };

  if (loading) {
    return <div className="inform-page">알림을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="inform-page">오류: {error}</div>;
  }

  return (
    <div className="inform-page">
      <div className="inform-header">
        <div className="back-arrow" onClick={() => navigate(-1)}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="inform-title">알림</div>
        <div className="empty-space"></div>
      </div>

      <div className="filter-buttons">
        <div
          className={`filter-button ${activeFilter === "전체" ? "active" : ""}`}
          onClick={() => setActiveFilter("전체")}
        >
          전체
        </div>
        <div
          className={`filter-button ${activeFilter === "쿠폰" ? "active" : ""}`}
          onClick={() => setActiveFilter("쿠폰")}
        >
          쿠폰
        </div>
        <div
          className={`filter-button ${
            activeFilter === "환불내역" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("환불내역")}
        >
          환불내역
        </div>
        <div
          className={`filter-button ${
            activeFilter === "결제내역" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("결제내역")}
        >
          결제내역
        </div>
        <div
          className={`filter-button ${
            activeFilter === "문의내역" ? "active" : ""
          }`}
          onClick={() => setActiveFilter("문의내역")}
        >
          문의내역
        </div>
      </div>

      <div className="notification-count">
        전체 {filteredNotifications.length}개
      </div>

      <div className="notification-list">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifications">알림이 없습니다.</div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              className="notification-card"
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {notification.type === "RESERVATION_APPROVED" ? (
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 44 44"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      width="44"
                      height="44"
                      rx="22"
                      fill="url(#paint0_linear_1409_2430)"
                    />
                    <path
                      d="M29.5 17.5L24 17.5C23.1716 17.5 22.5 16.8284 22.5 16C22.5 15.1716 23.1716 14.5 24 14.5L29.5 14.5C30.3284 14.5 31 15.1716 31 16C31 16.8284 30.3284 17.5 29.5 17.5Z"
                      fill="white"
                    />
                    <path
                      d="M20.5 17.5H15C14.1716 17.5 13.5 16.8284 13.5 16C13.5 15.1716 14.1716 14.5 15 14.5H20.5C21.3284 14.5 22 15.1716 22 16C22 16.8284 21.3284 17.5 20.5 17.5Z"
                      fill="white"
                    />
                    <path
                      d="M29.5 23.5H24C23.1716 23.5 22.5 22.8284 22.5 22C22.5 21.1716 23.1716 20.5 24 20.5H29.5C30.3284 20.5 31 21.1716 31 22C31 22.8284 30.3284 23.5 29.5 23.5Z"
                      fill="white"
                    />
                    <path
                      d="M20.5 23.5H15C14.1716 23.5 13.5 22.8284 13.5 22C13.5 21.1716 14.1716 20.5 15 20.5H20.5C21.3284 20.5 22 21.1716 22 22C22 22.8284 21.3284 23.5 20.5 23.5Z"
                      fill="white"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_1409_2430"
                        x1="22"
                        y1="0"
                        x2="22"
                        y2="44"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#FF7EB3" />
                        <stop offset="1" stopColor="#FF90C4" />
                      </linearGradient>
                    </defs>
                  </svg>
                ) : (
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 44 44"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      width="44"
                      height="44"
                      rx="22"
                      fill="url(#paint0_linear_1409_2433)"
                    />
                    <path d="M26.5 15.5H17.5V17.5H26.5V15.5Z" fill="white" />
                    <path d="M26.5 21.5H17.5V23.5H26.5V21.5Z" fill="white" />
                    <path d="M22.5 27.5H17.5V29.5H22.5V27.5Z" fill="white" />
                    <defs>
                      <linearGradient
                        id="paint0_linear_1409_2433"
                        x1="22"
                        y1="0"
                        x2="22"
                        y2="44"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#7EB3FF" />
                        <stop offset="1" stopColor="#90C4FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                )}
              </div>
              <div className="notification-content">
                <div className="notification-message">
                  {notification.message}
                </div>
                <div className="notification-time">
                  {notification.createdAt
                    ? new Date(notification.createdAt).toLocaleDateString()
                    : ""}
                </div>
              </div>
              {notification.isRead === false && (
                <div className="notification-dot"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileView;
