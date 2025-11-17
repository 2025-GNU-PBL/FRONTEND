import React from "react";
import MobileView from "./views/SharedScheduleCreateMobileView";
import WebView from "./views/SharedScheduleCreateWebView";

export default function OwnerSharedScheduleCreatePage() {
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
