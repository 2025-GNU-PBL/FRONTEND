import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // useNavigate 추가
import "./WebView.css";
import { getAllNotifications } from "../../../lib/api/axios";
import { markNotificationAsRead } from "../../../lib/api/notification"; // markNotificationAsRead 추가
import type { Notification } from "../../../type/notification";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store/store";

interface WebViewProps {
  liveNotifications: Notification[];
}

const WebView: React.FC<WebViewProps> = ({ liveNotifications }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // useNavigate 훅 사용
  const userRole = useSelector((state: RootState) => state.user.role);

  // liveNotifications 변화 감지 및 콘솔 출력 (제거)

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

  const allNotifications = Array.from(new Map(
    [...liveNotifications, ...notifications].map(notification => [notification.id, notification])
  ).values());
  const unreadCount = allNotifications.filter((n) => !n.isRead).length; // 읽지 않은 알림 개수 계산

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );

      // 알림 타입에 따른 라우팅
      if (notification.type === "PAYMENT_REQUIRED") {
        // 결제 요청 알림
        navigate("/checkout");
      } else if (userRole === "CUSTOMER" && notification.type == "PAYMENT_COMPLETED") {
        navigate("/my-page/client/payments");
      } else if (userRole === "OWNER" && notification.type == "PAYMENT_COMPLETED") {
        navigate("/my-page/owner/payments");
      } else if (userRole === "CUSTOMER" && notification.type === "PAYMENT_CANCELED") {
        navigate("/my-page/client/payments");
      } else if (userRole === "OWNER" && notification.type === "PAYMENT_CANCELED") {
        navigate("/my-page/owner/payments");
      } else if (
        userRole === "OWNER" &&
        (notification.type === "PAYMENT_CANCELED" ||
          notification.type == "PAYMENT_COMPLETED")
      ) {
        navigate("/my-page/owner/payments");
      } else if (
        userRole === "OWNER" &&
        notification.type == "PAYMENT_CANCEL_REQUEST"
      ) {
        navigate("/my-page/owner/cancels");
      } else if (
        userRole === "OWNER" &&
        notification.type == "RESERVATION_COMPLETED"
      ) {
        navigate("/my-page/owner/reservations");
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
    return <div className="web-inform-page">알림을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="web-inform-page">오류: {error}</div>;
  }

  return (
    <div className="web-inform-page">
      <div className="web-notification-list">
        {allNotifications.length === 0 ? (
          <div className="no-web-notifications">알림이 없습니다.</div>
        ) : (
          allNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`web-notification-card ${
                notification.isRead ? "read" : "unread"
              }`}
              onClick={() => handleNotificationClick(notification)} // notification 객체를 전달하도록 수정
            >
              <div className="web-notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <p className="web-notification-time">
                  {notification.createdAt
                    ? new Date(notification.createdAt).toLocaleString()
                    : ""}
                </p>
              </div>
              {notification.isRead === false && (
                <span className="web-notification-dot"></span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WebView;
