import { useState, useEffect } from "react";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

const CartPage = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // 768px 미만을 모바일로 간주

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile ? <MobileView /> : <WebView />;
};

export default CartPage;