import React, { useState, useEffect } from 'react';
import MobileView from './views/MobileView';
import WebView from './views/WebView';
import type { Notification } from '../../type/notification';

interface NotificationPageProps {
  liveNotifications: Notification[];
}

const NotificationPage: React.FC<NotificationPageProps> = ({ liveNotifications }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile ? <MobileView liveNotifications={liveNotifications} /> : <WebView liveNotifications={liveNotifications} />;
};

export default NotificationPage;
