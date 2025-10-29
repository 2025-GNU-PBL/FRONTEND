// EventPage.tsx  — 반응형 래퍼 (md 기준 분기)
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const EventPage = () => {
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

export default EventPage;
