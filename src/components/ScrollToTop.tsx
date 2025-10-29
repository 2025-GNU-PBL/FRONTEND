import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 라우트가 바뀔 때마다 최상단으로
    // (렌더 후 부드럽게 올리고 싶다면 behavior: "smooth")
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [pathname]);

  return null;
}
