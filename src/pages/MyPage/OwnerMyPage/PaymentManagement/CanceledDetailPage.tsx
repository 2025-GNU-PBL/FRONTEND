import MobileView from "./views/CanceledDetailMobileView";
import WebView from "./views/CanceledDetailWebView";

export default function CanceledDetailPage() {
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
