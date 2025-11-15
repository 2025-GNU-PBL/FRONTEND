import React from "react";
import MobileView from "./views/PersonalScheduleCreateMobileView";
import WebView from "./views/PersonalScheduleCreateWebView";

export default function OwnerSchedulePage() {
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
