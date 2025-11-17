// /sections/ResultsWeb.tsx
import { Icon } from "@iconify/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../lib/api/axios";
import ProductCard, { type CardProduct } from "../../../components/ProductCard";
import type { SortOption } from "../../../components/SortBottomSheet";

type ResultsProps = {
  /** 부모에서 넘기면 이 값을 우선 사용, 안 넘기면 URL ?q= 사용 */
  query?: string;
};

type PageInfo = {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
};

type Tag = {
  id: number;
  tagName: string;
};

type SearchItem = {
  id: number | string;
  name: string;
  brandName?: string;
  price: number | string;
  thumbnailUrl?: string | null;
  thumbnail?: string | null;
  viewCount?: number | string;
  isWished?: boolean;
  badges?: string[];
  tags?: Tag[];
  category?: string; // "WEDDING_HALL" | "DRESS" | "MAKEUP" | "STUDIO" 등
  rating?: number;
  starCount?: number;
};

type SearchResponse = {
  content: SearchItem[];
  page: PageInfo;
};

type Card = {
  id: string;
  img: string;
  brand: string;
  title: string;
  price: number;
  heart?: boolean;
  category?: string;
  rating: number;
};

const PAGE_SIZE = 6;
const DEFAULT_SORT = "LATEST";

export default function ResultsWeb({ query }: ResultsProps) {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const qFromUrl = sp.get("q")?.trim() ?? "";
  const keyword = (query ?? qFromUrl).trim();

  const [items, setItems] = useState<Card[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 정렬 상태 (모바일과 동일)
  const [sortOption, setSortOption] = useState<SortOption>("최신순");

  // 정렬 옵션 → API sortType 매핑
  const sortParam = useMemo(() => {
    if (sortOption === "최신순") return "LATEST";
    if (sortOption === "인기순") return "POPULAR";
    if (sortOption === "높은가격순") return "PRICE_DESC";
    if (sortOption === "낮은가격순") return "PRICE_ASC";
    return DEFAULT_SORT;
  }, [sortOption]);

  // 키워드 변경 시 상태 초기화
  useEffect(() => {
    if (!keyword) {
      setItems([]);
      setPageNumber(1);
      setHasMore(false);
      setTotalCount(null);
      setInitialLoaded(false);
      setError(null);
      return;
    }

    setItems([]);
    setPageNumber(1);
    setHasMore(false);
    setTotalCount(null);
    setInitialLoaded(false);
    setError(null);
  }, [keyword]);

  const mapToCard = (raw: SearchItem, index: number): Card => {
    const id = String(raw.id ?? index);
    const brand = raw.brandName || "브랜드명";
    const title = raw.name || "상품명";

    const priceNumber =
      typeof raw.price === "number" ? raw.price : Number(raw.price || 0);

    const img =
      (raw.thumbnailUrl &&
        raw.thumbnailUrl.trim().length > 0 &&
        raw.thumbnailUrl) ||
      (raw.thumbnail && raw.thumbnail.trim().length > 0 && raw.thumbnail) ||
      "/images/placeholder.png";

    const ratingRaw =
      typeof raw.rating === "number"
        ? raw.rating
        : typeof raw.starCount === "number"
        ? raw.starCount
        : 0;

    return {
      id,
      img,
      brand,
      title,
      price: Number.isNaN(priceNumber) ? 0 : priceNumber,
      heart: !!raw.isWished,
      category: raw.category,
      rating: Number.isNaN(ratingRaw) ? 0 : ratingRaw,
    };
  };

  const fetchPage = useCallback(
    async (page: number) => {
      if (!keyword) return;
      setLoading(true);
      setError(null);

      try {
        const res = await api.get<SearchResponse>("/api/v1/search", {
          params: {
            keyword,
            sortType: sortParam,
            pageNumber: page,
            pageSize: PAGE_SIZE,
          },
        });

        const data = res.data;
        const content = Array.isArray(data.content) ? data.content : [];
        const mapped = content.map(mapToCard);

        setItems((prev) => (page === 1 ? mapped : [...prev, ...mapped]));

        if (data.page && typeof data.page.totalElements === "number") {
          setTotalCount(data.page.totalElements);
        } else if (page === 1) {
          setTotalCount(mapped.length);
        }

        setHasMore(content.length === PAGE_SIZE);
        setInitialLoaded(true);
      } catch (err) {
        console.error(err);
        setError("검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    },
    [keyword, sortParam]
  );

  // 첫 페이지 및 페이지 변경 시 fetch
  useEffect(() => {
    if (!keyword) return;
    fetchPage(pageNumber);
  }, [keyword, pageNumber, fetchPage]);

  // 인피니트 스크롤 옵저버
  useEffect(() => {
    if (!keyword) return;
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loading && hasMore && initialLoaded) {
          setPageNumber((prev) => prev + 1);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [keyword, loading, hasMore, initialLoaded]);

  const displayCount = useMemo(() => {
    if (totalCount !== null) return totalCount;
    return items.length;
  }, [items.length, totalCount]);

  const getDetailPath = (category: string | undefined, id: string) => {
    switch (category) {
      case "DRESS":
        return `/dress/${id}`;
      case "WEDDING_HALL":
        return `/wedding/${id}`;
      case "MAKEUP":
        return `/makeup/${id}`;
      case "STUDIO":
        return `/studio/${id}`;
      default:
        return `/product/${id}`;
    }
  };

  const handleCardClick = useCallback(
    (id: string, category?: string) => {
      const path = getDetailPath(category, id);
      navigate(path);
    },
    [navigate]
  );

  const handleToggleLike = useCallback((id: number) => {
    console.log("toggle like from search result (web):", id);
  }, []);

  const handleChangeSort = useCallback((opt: SortOption) => {
    setSortOption(opt);
    // 목록 리셋 후 1페이지부터 다시 호출
    setItems([]);
    setHasMore(false);
    setTotalCount(null);
    setPageNumber(1);
    setInitialLoaded(false);
    setError(null);
  }, []);

  if (!keyword) return null;

  const sortButtons: { label: SortOption; icon: string }[] = [
    { label: "최신순", icon: "solar:clock-circle-outline" },
    { label: "인기순", icon: "tabler:flame" },
    { label: "높은가격순", icon: "tabler:currency-won" },
    { label: "낮은가격순", icon: "tabler:currency-won" },
  ];

  return (
    <div className="relative w-full min-h-[400px]">
      {/* 상단 결과 개수 & 정렬 버튼 */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-[14px] leading-[150%] tracking-[-0.2px] text-[#595F63]">
          {initialLoaded && displayCount === 0 ? "" : `총 ${displayCount}개`}
        </div>

        <div className="flex items-center gap-2">
          {sortButtons.map((btn) => {
            const active = sortOption === btn.label;
            const isPriceDown = btn.label === "낮은가격순";

            return (
              <button
                key={btn.label}
                type="button"
                onClick={() => handleChangeSort(btn.label)}
                className={[
                  "inline-flex items-center gap-1 h-8 px-3 rounded-full border text-xs transition",
                  active
                    ? "border-black bg-black text-white"
                    : "border-[#D0D4DA] bg-white text-[#555B65] hover:border-black/50 hover:bg-[#F3F4F5]",
                ].join(" ")}
              >
                <Icon
                  icon={btn.icon}
                  className={[
                    "w-4 h-4",
                    btn.label === "높은가격순" ? "rotate-180" : "",
                    isPriceDown ? "" : "",
                  ].join(" ")}
                />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && <div className="mb-4 text-[13px] text-red-500">{error}</div>}

      {/* 카드 그리드 - ProductCard 재사용 (데스크톱 레이아웃) */}
      {!error && (
        <>
          <div className="grid gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => {
              const product: CardProduct = {
                id: Number(it.id),
                name: it.title,
                ownerName: it.brand,
                price: it.price,
                thumbnail: it.img,
                starCount: it.rating ?? 0,
              };

              return (
                <ProductCard
                  key={`p-${product.id}`}
                  product={product}
                  liked={it.heart ?? false}
                  onToggleLike={handleToggleLike}
                  onClick={() =>
                    handleCardClick(String(product.id), it.category)
                  }
                />
              );
            })}

            {/* 로딩 스켈레톤 (첫 로딩 시) */}
            {loading &&
              items.length === 0 &&
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="animate-pulse w-full flex flex-col gap-3"
                >
                  <div className="w-full aspect-[4/3] rounded-[12px] bg-gray-100" />
                  <div className="h-3 w-2/5 rounded bg-gray-100" />
                  <div className="h-3 w-4/5 rounded bg-gray-100" />
                  <div className="h-4 w-1/2 rounded bg-gray-100" />
                </div>
              ))}
          </div>

          {/* 인피니트 스크롤 sentinel */}
          <div ref={sentinelRef} className="w-full h-4" />

          {loading && items.length > 0 && (
            <div className="py-4 text-center">
              <p className="text-[12px] text-[#595F63]">불러오는 중…</p>
            </div>
          )}

          {!loading && !hasMore && items.length > 0 && (
            <div className="py-4 text-center">
              <p className="text-[12px] text-[#999999]">마지막 상품입니다.</p>
            </div>
          )}

          {initialLoaded && !loading && items.length === 0 && !error && (
            <div className="mt-10 rounded-xl border border-dashed border-gray-200 p-6 text-center text-[#8B9199] text-[13px]">
              검색 조건에 맞는 상품이 없습니다.
            </div>
          )}
        </>
      )}
    </div>
  );
}
