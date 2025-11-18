import MobileView from "./views/ListMoblieView";
import WebView from "./views/ListWebView";

const CouponEditPage = () => {
  return (
    <div className="min-h-screen">
      <div className="md:hidden">
        <MobileView />
      </div>
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
};

export default CouponEditPage;
