import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const ProductEdit = () => {
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

export default ProductEdit;
