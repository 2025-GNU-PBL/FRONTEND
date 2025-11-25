import { useState } from "react";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

export default function OwnerMyPageMain() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-white">
      {/* 모바일 */}
      <div className="md:hidden">
        <MobileView
          isMenuOpen={isMenuOpen}
          openMenu={openMenu}
          closeMenu={closeMenu}
        />
      </div>

      {/* 데스크톱 */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
}
