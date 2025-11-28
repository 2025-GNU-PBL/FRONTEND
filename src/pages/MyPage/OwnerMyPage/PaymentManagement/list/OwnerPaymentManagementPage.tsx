import MobileView from "./views/MoblieView";
import WebView from "./views/WebView";

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
