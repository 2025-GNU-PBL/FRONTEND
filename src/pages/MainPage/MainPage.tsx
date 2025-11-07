import { useEffect, useState } from "react";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";
import api from "../../lib/api/axios";
import type { Product } from "../../type/product";

type CategoryKey = "hall" | "studio" | "dress" | "makeup";

type PageMeta = {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
};

type PageResponse<T> = {
  content: T[];
  page: PageMeta;
};

const categories: { key: CategoryKey; label: string; icon: string }[] = [
  { key: "hall", label: "웨딩홀", icon: "/images/wedding.png" },
  { key: "studio", label: "스튜디오", icon: "/images/studio.png" },
  { key: "dress", label: "드레스", icon: "/images/dress.png" },
  { key: "makeup", label: "메이크업", icon: "/images/makeup.png" },
];

const ENDPOINT_BY_CATEGORY: Record<CategoryKey, string> = {
  hall: "/api/v1/wedding-hall/filter",
  studio: "/api/v1/studio/filter",
  dress: "/api/v1/dress/filter",
  makeup: "/api/v1/makeup/filter",
};

export default function MainPage() {
  const [active, setActive] = useState<CategoryKey>("hall");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 서버 데이터 (첫 페이지)
  const [products, setProducts] = useState<Product[]>([]);
  const [pageMeta, setPageMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // ✅ 첫 페이지(0번)만 로드
  useEffect(() => {
    let canceled = false;

    const fetchFirstPage = async () => {
      const endpoint = ENDPOINT_BY_CATEGORY[active];
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await api.get<PageResponse<Product>>(endpoint, {
          params: { page: 0, size: 12 },
        });

        if (canceled) return;

        const data = res.data;
        const safeContent = Array.isArray(data?.content) ? data.content : [];
        setProducts(safeContent);
        setPageMeta(data?.page ?? null);
      } catch (err) {
        console.error(err);
        if (canceled) return;
        setErrorMsg("상품을 불러오지 못했습니다.");
        setProducts([]);
        setPageMeta(null);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchFirstPage();
    return () => {
      canceled = true;
    };
  }, [active]);

  return (
    <div className="min-h-screen bg-white">
      {/* -------------------- mobile -------------------- */}
      <div className="md:hidden">
        <MobileView
          active={active}
          setActive={setActive}
          categories={categories}
          products={products}
          pageMeta={pageMeta}
          isMenuOpen={isMenuOpen}
          openMenu={() => setIsMenuOpen(true)}
          closeMenu={() => setIsMenuOpen(false)}
        />
      </div>

      {/* -------------------- web -------------------- */}
      <div className="hidden md:block">
        <WebView
          active={active}
          setActive={setActive}
          categories={categories}
          products={products}
          isMenuOpen={isMenuOpen}
          openMenu={() => setIsMenuOpen(true)}
          closeMenu={() => setIsMenuOpen(false)}
        />
      </div>

      {/* 로딩/에러 오버레이 */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] text-black text-sm">
          불러오는 중...
        </div>
      )}
      {!loading && errorMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-black text-white text-sm px-3 py-2 shadow">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
