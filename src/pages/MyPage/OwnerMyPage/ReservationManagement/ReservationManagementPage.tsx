import React from "react";
import MobileView from "./views/ListMoblieView";
import WebView from "./views/ListWebView";

export default function ReservationManagementPage() {
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
