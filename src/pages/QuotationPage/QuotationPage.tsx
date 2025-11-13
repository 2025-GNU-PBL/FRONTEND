import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const QuotationPage = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* 모바일 */}
      <div className="md:hidden">
        <MobileView />
      </div>

      {/* 웹 */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
};

export default QuotationPage;
