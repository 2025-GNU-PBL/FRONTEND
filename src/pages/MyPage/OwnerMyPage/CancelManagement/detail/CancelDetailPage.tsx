import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

export default function CancelDetailPage() {
  return (
    <div className="">
      <div className="md:hidden">
        <MobileView />
      </div>
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
}
