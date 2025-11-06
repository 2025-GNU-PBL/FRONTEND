import React from "react";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const WeddingHallPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-white">
      {/* 모바일 */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* 웹 */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
};

export default WeddingHallPage;
