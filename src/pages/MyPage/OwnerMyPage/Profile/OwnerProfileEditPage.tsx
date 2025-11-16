import MobileView from "./views/ProfileEditMobile";
import WebView from "./views/ProfileEditWebView";

export default function OwnerProfileEditPage() {
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
