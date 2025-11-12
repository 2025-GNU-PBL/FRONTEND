import React, { useState, useEffect } from 'react';
import './WebView.css';
import { getAllNotifications } from '../../../lib/api/axios';
import type { Notification } from '../../../type/notification';

interface WebViewProps {
  liveNotifications: Notification[];
}

const WebView: React.FC<WebViewProps> = ({ liveNotifications }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div className='web-inform-page'>Loading notifications...</div>;
  }

  if (error) {
    return <div className='web-inform-page'>Error: {error}</div>;
  }

  return (
    <div className='web-inform-page'>
      <h1>웹 알림</h1>
      <div className='web-notification-list'>
        {allNotifications.map((notification) => (
          <div key={notification.id} className='web-notification-card'>
            <h3>{notification.title}</h3>
            <p>{notification.message}</p>
            <p>{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}</p>
            {notification.isRead === false && <span className='web-notification-dot'></span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebView;
