import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const FaqPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="md:hidden">
        <MobileView />
      </div>
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
};

export default FaqPage;
