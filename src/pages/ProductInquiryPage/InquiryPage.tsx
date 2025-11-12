import React, { useState, useEffect } from 'react';
import MobileView from './views/MobileView';
import WebView from './views/WebView';

const InquiryPage: React.FC = () => {
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

  return isMobile ? <MobileView /> : <WebView />;
};

export default InquiryPage;
