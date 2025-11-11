import MobileView from "./MobileView";
import WebView from "./WebView";

export default function OwnerMyPageMain() {
  return (
    <div className="min-h-screen bg-white">
      {/* 모바일 */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* 데스크톱 */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
}
