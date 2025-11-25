import MobileView from "./views/RegisterMobileView";
import WebView from "./views/RegisterWebView";

const CouponRegisterPage = () => {
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

export default CouponRegisterPage;
