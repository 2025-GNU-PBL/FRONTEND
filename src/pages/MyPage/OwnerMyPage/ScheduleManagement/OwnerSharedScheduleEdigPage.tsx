import React from "react";
import MobileView from "./views/SharedScheduleEditMobileView";
import WebView from "./views/SharedScheduleEditWebView";

export default function OwnerSharedScheduleEditPage() {
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
