import MobileView from "./views/MoblieView";
import WebView from "./views/WebView";

const CouponListPage = () => {
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

export default CouponListPage;
