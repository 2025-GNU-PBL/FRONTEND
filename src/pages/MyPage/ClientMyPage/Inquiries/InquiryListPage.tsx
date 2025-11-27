import MobileView from "./views/ListMobileView";
import WebView from "./views/ListWebView";

export default function InquiryPage() {
  return (
    <div className="w-full bg-white">
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
