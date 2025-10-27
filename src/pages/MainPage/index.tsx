// src/pages/MainPage/index.tsx
import { useEffect, useState } from "react";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

type CategoryKey = "hall" | "studio" | "dress" | "makeup";

type Product = {
  id: string;
  title: string;
  image: string;
  subtitle?: string;
  price?: string;
  tag?: string;
  avg_star?: number;
  address?: string;
};

const categories: { key: CategoryKey; label: string; icon: string }[] = [
  { key: "hall", label: "웨딩홀", icon: "/images/wedding.png" },
  { key: "studio", label: "스튜디오", icon: "/images/studio.png" },
  { key: "dress", label: "드레스", icon: "/images/dress.png" },
  { key: "makeup", label: "메이크업", icon: "/images/makeup.png" },
];

const productsByCategory: Record<CategoryKey, Product[]> = {
  hall: [
    {
      id: "h1",
      title: "라움 웨딩홀 fnkldan fklnkfle  ",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1zAAlDnrTclZIxGLtMyZt_qkQ4A1OVdAczA&s",
      subtitle: "청담 | 200~300석",
      price: "₩3,200,000~",
      tag: "인기",
      avg_star: 4.5,
      address: "서울 강남구 청담동",
    },
    {
      id: "h2",
      title: "드레스가든",
      image:
        "https://www.iwedding.co.kr/center/website/brandplus/fb_1718340275.jpg",
      subtitle: "역삼 | 150~250석",
      price: "₩2,700,000~",
    },
    {
      id: "h3",
      title: "아펠가모",
      image: "/images/sample_hall_3.jpg",
      subtitle: "논현 | 200~350석",
      price: "₩3,800,000~",
    },
    {
      id: "h3-dup",
      title: "아펠가모",
      image: "/images/sample_hall_3.jpg",
      subtitle: "논현 | 200~350석",
      price: "₩3,800,000~",
    },
  ],
  studio: [
    {
      id: "s1",
      title: "포토시그니처",
      image: "/images/sample_studio_1.jpg",
      subtitle: "감성 스냅",
      price: "₩900,000~",
    },
    {
      id: "s2",
      title: "원규스튜디오",
      image: "/images/sample_studio_2.jpg",
      subtitle: "클래식",
      price: "₩1,200,000~",
      tag: "추천",
    },
    {
      id: "s3",
      title: "리유스튜디오",
      image: "/images/sample_studio_3.jpg",
      subtitle: "모던",
      price: "₩1,050,000~",
    },
  ],
  dress: [
    {
      id: "d1",
      title: "로자스포사",
      image: "/images/sample_dress_1.jpg",
      subtitle: "프리미엄",
      price: "₩1,800,000~",
    },
    {
      id: "d2",
      title: "브라이드K",
      image: "/images/sample_dress_2.jpg",
      subtitle: "모던 심플",
      price: "₩1,300,000~",
    },
    {
      id: "d3",
      title: "아벨바이케이",
      image: "/images/sample_dress_3.jpg",
      subtitle: "엘레강스",
      price: "₩1,600,000~",
      tag: "인기",
    },
  ],
  makeup: [
    {
      id: "m1",
      title: "제니하우스",
      image: "/images/sample_mu_1.jpg",
      subtitle: "한남",
      price: "₩650,000~",
    },
    {
      id: "m2",
      title: "순수 청담",
      image: "/images/sample_mu_2.jpg",
      subtitle: "청담",
      price: "₩720,000~",
    },
    {
      id: "m3",
      title: "청담아이디",
      image: "/images/sample_mu_3.jpg",
      subtitle: "청담",
      price: "₩600,000~",
      tag: "추천",
    },
  ],
};

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

      {/* -------------------- web -------------------- */}
      <div className="hidden md:block">
        <WebView />
      </div>
    </div>
  );
}
