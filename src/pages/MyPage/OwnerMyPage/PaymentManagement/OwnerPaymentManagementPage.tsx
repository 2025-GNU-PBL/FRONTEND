import MobileView from "./views/ListMoblieView";
import WebView from "./views/ListWebView";

export default function OwnerPaymentManagementPage() {
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
