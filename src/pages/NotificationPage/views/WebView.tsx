import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate 추가
import './WebView.css';
import { getAllNotifications } from '../../../lib/api/axios';
import { markNotificationAsRead } from '../../../lib/api/notification'; // markNotificationAsRead 추가
import type { Notification } from '../../../type/notification';

interface WebViewProps {
  liveNotifications: Notification[];
}

const WebView: React.FC<WebViewProps> = ({ liveNotifications }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // useNavigate 훅 사용

  // liveNotifications 변화 감지 및 콘솔 출력 (제거)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getAllNotifications();
        setNotifications(response.data as Notification[]);
      } catch (err) {
        setError('Failed to fetch notifications.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const allNotifications = [...liveNotifications, ...notifications];
  const unreadCount = allNotifications.filter(n => !n.isRead).length; // 읽지 않은 알림 개수 계산

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );

      if (notification.type === 'PAYMENT_REQUIRED') {
        navigate('/checkout'); // 결제 요청 알림일 경우 리다이렉트
      } else if (notification.actionUrl) {
        navigate(notification.actionUrl); // actionUrl이 있다면 해당 URL로 이동
      }

    } catch (error) {
      console.error("Failed to mark notification as read or navigate:", error);
    }
  };

  if (loading) {
    return <div className='web-inform-page'>알림을 불러오는 중...</div>;
  }

  if (error) {
    return <div className='web-inform-page'>오류: {error}</div>;
  }

  return (
    <div className='web-inform-page'>
      <div className='web-notification-list'>
        {allNotifications.length === 0 ? (
          <div className='no-web-notifications'>알림이 없습니다.</div>
        ) : (
          allNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`web-notification-card ${notification.isRead ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(notification)} // notification 객체를 전달하도록 수정
            >
              <div className='web-notification-content'>
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <p className='web-notification-time'>
                  {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                </p>
              </div>
              {notification.isRead === false && <span className='web-notification-dot'></span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WebView;
