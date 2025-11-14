import MobileView from "./views/EditMobileView";
import WebView from "./views/EditWebView";

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
