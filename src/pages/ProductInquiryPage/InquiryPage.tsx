import React from "react";
import MobileView from "./views/InquiryMobileView";
import WebView from "./views/InquiryWebView";

export default function InquiryPage() {
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
