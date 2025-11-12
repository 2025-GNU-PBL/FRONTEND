import React, { useState, useEffect } from 'react';
import MobileView from './views/MobileView';
import WebView from './views/WebView';
import { subscribeToNotifications } from '../../lib/api/notificationService';
import type { Notification } from '../../type/notification';

const NotificationPage: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [liveNotifications, setLiveNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const cleanup = subscribeToNotifications(
      (newNotification) => {
        setLiveNotifications((prev) => [newNotification, ...prev]);
      },
      (error) => {
        console.error("SSE subscription error:", error);
      }
    );

    return cleanup; // Cleanup EventSource on unmount
  }, []);

  return isMobile ? <MobileView liveNotifications={liveNotifications} /> : <WebView liveNotifications={liveNotifications} />;
};

export default NotificationPage;
