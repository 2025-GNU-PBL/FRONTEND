// src/pages/MainPage/index.tsx
import { useEffect, useState } from "react";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";
import { productsByCategory } from "./temp";

type CategoryKey = "hall" | "studio" | "dress" | "makeup";

const categories: { key: CategoryKey; label: string; icon: string }[] = [
  { key: "hall", label: "웨딩홀", icon: "/images/wedding.png" },
  { key: "studio", label: "스튜디오", icon: "/images/studio.png" },
  { key: "dress", label: "드레스", icon: "/images/dress.png" },
  { key: "makeup", label: "메이크업", icon: "/images/makeup.png" },
];

export default function MainPage() {
  const [active, setActive] = useState<CategoryKey>("hall");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 메뉴 열릴 때 스크롤 잠금
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = isMenuOpen ? "hidden" : original || "";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isMenuOpen]);

  // ESC로 드로어 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeProducts = productsByCategory[active];

  return (
    <div className="min-h-screen bg-white">
      {/* -------------------- mobile -------------------- */}
      <div className="md:hidden">
        <MobileView
          active={active}
          setActive={setActive}
          categories={categories}
          products={activeProducts}
          isMenuOpen={isMenuOpen}
          openMenu={() => setIsMenuOpen(true)}
          closeMenu={() => setIsMenuOpen(false)}
        />
      </div>

      {/* web */}
      <div className="hidden md:block">
        <WebView
          active={active}
          setActive={setActive}
          categories={categories}
          products={activeProducts}
          isMenuOpen={isMenuOpen}
          openMenu={() => setIsMenuOpen(true)}
          closeMenu={() => setIsMenuOpen(false)}
        />
      </div>
    </div>
  );
}
