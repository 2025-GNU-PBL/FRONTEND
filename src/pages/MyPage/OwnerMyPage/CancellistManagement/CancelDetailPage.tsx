import MobileView from "./views/CancelDetailMobileView";
import WebView from "./views/CancelDetailWebView";

export default function CancelDetailPage() {
  return (
    <div className="w-full bg-[#F6F7FB]">
      <div className="md:hidden">
        <MobileView />
      </div>
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
}
