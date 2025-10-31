import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const ClientLoginPage = () => {
  return (
    <div className="w-full min-h-screen bg-[#F6F7FB]">
      {/* Mobile View */}
      <div className="md:hidden">
        <MobileView />
      </div>
      {/* Web View */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
};

export default ClientLoginPage;
