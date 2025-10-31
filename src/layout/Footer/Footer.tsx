import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const Footer = () => {
  return (
    <footer className="bg-white text-gray-700 border-t border-gray-300 font-sans">
      <MobileView />
      <WebView />
    </footer>
  );
};

export default Footer;
