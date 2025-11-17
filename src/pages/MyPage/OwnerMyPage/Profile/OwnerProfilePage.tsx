import MobileView from "./views/ProfileMobileView";
import WebView from "./views/ProfileWebView";

export default function OwnerProfilePage() {
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
