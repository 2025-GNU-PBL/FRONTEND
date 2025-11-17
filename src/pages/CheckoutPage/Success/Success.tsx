import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const Success = () => {
  return (
    <div className="min-h-screen">
      {/* 모바일 뷰 */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* 웹 뷰 */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
};

export default Success;
