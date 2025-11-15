import React from "react";
import MobileView from "./views/CalendarMoblieView";
import WebView from "./views/CalendarWebView";

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
