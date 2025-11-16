import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const MakeupPage = () => {
  return (
    <div className="w-full min-h-screen">
      {/* 모바일 */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* 웹 */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
};

export default MakeupPage;
