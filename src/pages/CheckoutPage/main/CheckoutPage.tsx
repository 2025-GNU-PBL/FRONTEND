import React from "react";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const CheckoutPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* 모바일 뷰 */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* 웹 뷰 */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
};

export default CheckoutPage;
