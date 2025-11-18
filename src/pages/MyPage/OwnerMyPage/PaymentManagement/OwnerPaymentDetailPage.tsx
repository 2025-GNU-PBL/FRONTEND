import MobileView from "./views/DetailMobileView";
import WebView from "./views/DetailWebView";

export default function OwnerPaymentDetailPage() {
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
