import React from 'react';
import './CustomNotificationToast.css';

interface CustomNotificationToastProps {
  message: string;
}

const CustomNotificationToast: React.FC<CustomNotificationToastProps> = ({ message }) => {
  return (
    <div className="custom-toast-container">
      <div className="custom-toast-icon-wrapper">
        {/* 제공된 이미지의 체크마크 SVG로 교체 */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13L10 18L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="custom-toast-message">{message}</div>
    </div>
  );
};

export default CustomNotificationToast;
