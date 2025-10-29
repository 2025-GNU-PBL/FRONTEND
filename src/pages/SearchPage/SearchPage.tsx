// ✅ 반응형 래퍼: md 미만은 MobileView, md 이상은 WebView 노출
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white">
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
