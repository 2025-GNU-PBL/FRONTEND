// 예: src/pages/ReviewCreate.tsx 또는 app/(routes)/review/ReviewCreate.tsx 등
import React from "react";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const ReviewCreate: React.FC = () => {
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* Web */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </>
  );
};

export default ReviewCreate;
