import React from "react";
import MobileView from "./views/PersonalScheduleEditMobileView";
import WebView from "./views/PersonalScheduleEditWebView";

export default function PersonalScheduleEditPage() {
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
