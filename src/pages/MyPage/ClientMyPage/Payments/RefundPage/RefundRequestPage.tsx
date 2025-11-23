import MobileView from "./views/RefundRequestMobileView";
import WebView from "./views/RefundRequestWebView";

export default function RefundRequestPage() {
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
