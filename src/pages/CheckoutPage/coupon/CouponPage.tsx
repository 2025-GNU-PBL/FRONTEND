import React from "react";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const CouponPage: React.FC = () => {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </>
  );
};

export default CouponPage;
