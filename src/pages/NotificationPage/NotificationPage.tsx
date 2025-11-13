import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const NotificationPage = () => {
  return (
    <>
      <div className="md:hidden">
        <MobileView />
      </div>
      <div className="hidden md:block">
        <WebView />
      </div>
    </>
  );
};

export default NotificationPage;
