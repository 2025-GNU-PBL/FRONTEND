import React, { useState, useEffect } from 'react';
import './MobileView.css';
import { getAllNotifications } from '../../../lib/api/axios';
import type { Notification } from '../../../type/notification';

interface MobileViewProps {
  liveNotifications: Notification[];
}

const MobileView: React.FC<MobileViewProps> = ({ liveNotifications }) => {
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
    return <div className='inform-page'>Loading notifications...</div>;
  }

  if (error) {
    return <div className='inform-page'>Error: {error}</div>;
  }

  return (
    <div className='inform-page'>
      {/* Header */}
      <div className='inform-header'>
        <div className='back-arrow'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M15 18L9 12L15 6' stroke='black' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </div>
        <div className='inform-title'>알림</div>
        <div className='empty-space'></div>
      </div>

      {/* Filter Buttons */}
      <div className='filter-buttons'>
        <div className='filter-button active'>전체</div>
        <div className='filter-button'>쿠폰</div>
        <div className='filter-button'>환불내역</div>
        <div className='filter-button'>결제내역</div>
        <div className='filter-button'>문의내역</div>
      </div>

      {/* Notification Count */}
      <div className='notification-count'>전체 {allNotifications.length}개</div>

      {/* Notification List */}
      <div className='notification-list'>
        {allNotifications.length === 0 ? (
          <div className='no-notifications'>알림이 없습니다.</div>
        ) : (
          allNotifications.map((notification) => (
            <div className='notification-card' key={notification.id}>
              <div className={`notification-icon`}>
                {notification.type === 'RESERVATION_APPROVED' ? (
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="44" height="44" rx="22" fill="url(#paint0_linear_1409_2430)"/>
                    <path d="M29.5 17.5L24 17.5C23.1716 17.5 22.5 16.8284 22.5 16C22.5 15.1716 23.1716 14.5 24 14.5L29.5 14.5C30.3284 14.5 31 15.1716 31 16C31 16.8284 30.3284 17.5 29.5 17.5Z" fill="white"/>
                    <path d="M20.5 17.5H15C14.1716 17.5 13.5 16.8284 13.5 16C13.5 15.1716 14.1716 14.5 15 14.5H20.5C21.3284 14.5 22 15.1716 22 16C22 16.8284 21.3284 17.5 20.5 17.5Z" fill="white"/>
                    <path d="M29.5 23.5H24C23.1716 23.5 22.5 22.8284 22.5 22C22.5 21.1716 23.1716 20.5 24 20.5H29.5C30.3284 20.5 31 21.1716 31 22C31 22.8284 30.3284 23.5 29.5 23.5Z" fill="white"/>
                    <path d="M20.5 23.5H15C14.1716 23.5 13.5 22.8284 13.5 22C13.5 21.1716 14.1716 20.5 15 20.5H20.5C21.3284 20.5 22 21.1716 22 22C22 22.8284 21.3284 23.5 20.5 23.5Z" fill="white"/>
                    <defs>
                    <linearGradient id="paint0_linear_1409_2430" x1="22" y1="0" x2="22" y2="44" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FF7EB3"/>
                    <stop offset="1" stop-color="#FF90C4"/>
                    </linearGradient>
                    </defs>
                  </svg>
                ) : (
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="44" height="44" rx="22" fill="url(#paint0_linear_1409_2433)"/>
                    <path d="M26.5 15.5H17.5V17.5H26.5V15.5Z" fill="white"/>
                    <path d="M26.5 21.5H17.5V23.5H26.5V21.5Z" fill="white"/>
                    <path d="M22.5 27.5H17.5V29.5H22.5V27.5Z" fill="white"/>
                    <defs>
                    <linearGradient id="paint0_linear_1409_2433" x1="22" y1="0" x2="22" y2="44" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#7EB3FF"/>
                    <stop offset="1" stop-color="#90C4FF"/>
                    </linearGradient>
                    </defs>
                  </svg>
                )}
              </div>
              <div className='notification-content'>
                <div className='notification-message'>{notification.message}</div>
                <div className='notification-time'>
                  {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ''}
                </div>
              </div>
              {notification.isRead === false && <div className='notification-dot'></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileView;
