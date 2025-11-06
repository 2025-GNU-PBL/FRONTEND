import { useEffect, useMemo, useState, useCallback } from "react";
import MobileView from "./views/MobileView";
import WebView from "./views/WebView";

// ✅ 즐겨찾기 아이템 타입
export type FavoriteItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  price?: number;
  category?: "studio" | "dress" | "makeup" | "etc";
  // 필요 시 필드 추가
};

// ✅ 로컬스토리지 키
const LS_KEY = "favorites";

const sampleData: FavoriteItem[] = [
  {
    id: "1",
    title: "화이트 드레스 A라인",
    subtitle: "S/S 컬렉션 · 신상",
    imageUrl:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
    price: 480000,
    category: "dress",
  },
  {
    id: "2",
    title: "모던 스튜디오 패키지",
    subtitle: "3시간 · 리터칭 15장",
    imageUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
    price: 890000,
    category: "studio",
  },
  {
    id: "3",
    title: "내추럴 메이크업",
    subtitle: "시연 포함",
    imageUrl:
      "https://images.unsplash.com/photo-1505577028192-83f09c7c3c99?q=80&w=1200&auto=format&fit=crop",
    price: 220000,
    category: "makeup",
  },
];

function readFromStorage(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return sampleData;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return sampleData;
    return parsed;
  } catch {
    return sampleData;
  }
}

function writeToStorage(items: FavoriteItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // noop
  }
}

const FavoritesPage = () => {
  const [items, setItems] = useState<FavoriteItem[]>(() => readFromStorage());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FavoriteItem["category"] | "all">(
    "all"
  );
  const [sort, setSort] = useState<"recent" | "priceAsc" | "priceDesc">(
    "recent"
  );

  useEffect(() => {
    writeToStorage(items);
  }, [items]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  const filtered = useMemo(() => {
    let next = [...items];

    // 검색
    if (query.trim()) {
      const q = query.toLowerCase();
      next = next.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          (it.subtitle ?? "").toLowerCase().includes(q)
      );
    }

    // 카테고리
    if (category !== "all") {
      next = next.filter((it) => it.category === category);
    }

    // 정렬
    if (sort === "priceAsc") {
      next.sort(
        (a, b) =>
          (a.price ?? Number.MAX_SAFE_INTEGER) -
          (b.price ?? Number.MAX_SAFE_INTEGER)
      );
    } else if (sort === "priceDesc") {
      next.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    } else {
      // recent: 로컬 배열 순서를 최신으로 취급 (이미 최신이 앞쪽)
      // 별도 작업 없음
    }

    return next;
  }, [items, query, category, sort]);

  // 공통 핸들러 묶어서 프리젠테이션 컴포넌트에 전달
  const viewProps = {
    items: filtered,
    totalCount: items.length,
    query,
    setQuery,
    category,
    setCategory,
    sort,
    setSort,
    onRemove: removeItem,
    onClear: clearAll,
  };

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileView {...viewProps} />
      </div>

      {/* Web */}
      <div className="hidden md:block mt-15 -mb-15">
        <WebView {...viewProps} />
      </div>
    </>
  );
};

export default FavoritesPage;
