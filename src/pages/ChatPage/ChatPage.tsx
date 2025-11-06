import React from "react";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const ChatPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen">
      {/* 모바일 전용 */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* 데스크탑 전용 */}
      <div className="hidden md:block mt-15 -mb-15">
        <WebView />
      </div>
    </div>
  );
};

export default ChatPage;
