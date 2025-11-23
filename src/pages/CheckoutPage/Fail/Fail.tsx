import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const Fail = () => {
  return (
    <div className="min-h-screen">
      {/* 모바일 뷰 */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* 웹 뷰 */}
      <div className="hidden md:block mt-15 -mb-40">
        <WebView />
      </div>
    </div>
  );
};

export default Fail;
