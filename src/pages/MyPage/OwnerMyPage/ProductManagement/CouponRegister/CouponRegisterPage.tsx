import React from "react";
import MobileView from "./views/RegisterMobile";
import WebView from "./views/RegisterWeb";

export default function CouponRegisterPage() {
  return (
    <div className="w-full bg-white">
      {/* Mobile */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* Web */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
}
