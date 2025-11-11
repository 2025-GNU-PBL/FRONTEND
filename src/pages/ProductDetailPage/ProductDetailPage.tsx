// ProductDetailPage.jsx

import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const ProductDetailPage = () => {
  return (
    <div className="w-full min-h-screen bg-white text-[#1E2124]">
      {/* 모바일: md 미만 */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* 웹: md 이상 */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
};

export default ProductDetailPage;
