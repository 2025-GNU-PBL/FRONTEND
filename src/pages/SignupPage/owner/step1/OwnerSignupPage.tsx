import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

export default function OwnerSignupPage() {
  return (
    <div>
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
