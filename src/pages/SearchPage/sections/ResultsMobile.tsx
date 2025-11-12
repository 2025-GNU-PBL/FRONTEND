// sections/ResultsMobile.tsx
import { Icon } from "@iconify/react";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../lib/api/axios";

type ResultsProps = {
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
  price: string;
  views: string;
  badges?: { label: string; bg: string; color: string }[];
  heart?: boolean;
};

const PAGE_SIZE = 6;
const DEFAULT_SORT = "LATEST";

export default function ResultsMobile({ query }: ResultsProps) {
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

    // 가격
    const priceNumber =
      typeof raw.price === "number" ? raw.price : Number(raw.price || 0);
    const price =
      priceNumber > 0 ? `${priceNumber.toLocaleString()}원` : "가격 정보 없음";

    // 조회수
    const viewCount =
      typeof raw.viewCount === "number"
        ? raw.viewCount
        : Number(raw.viewCount || 0);
    const views =
      viewCount > 0 ? `${viewCount.toLocaleString()}명이 봤어요` : "";

    // 이미지
    const img =
      (raw.thumbnailUrl &&
        raw.thumbnailUrl.trim().length > 0 &&
        raw.thumbnailUrl) ||
      (raw.thumbnail && raw.thumbnail.trim().length > 0 && raw.thumbnail) ||
      "/images/placeholder.png";

    // 배지: badges(string[]) 우선, 없으면 tags 사용
    const badgesFromBadges =
      raw.badges && raw.badges.length > 0
        ? raw.badges.map((label) => ({
            label,
            bg: "#EFEBFF",
            color: "#803BFF",
          }))
        : [];

    const badgesFromTags =
      raw.tags && raw.tags.length > 0
        ? raw.tags.map((tag) => ({
            label: tag.tagName,
            bg: "#EFEBFF",
            color: "#803BFF",
          }))
        : [];

    const badges =
      badgesFromBadges.length > 0
        ? badgesFromBadges
        : badgesFromTags.length > 0
        ? badgesFromTags
        : undefined;

    return {
      id,
      img,
      brand,
      title,
      price,
      views,
      badges,
      heart: !!raw.isWished,
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
            sortType: DEFAULT_SORT,
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

        // 다음 페이지 여부
        setHasMore(content.length === PAGE_SIZE);
        setInitialLoaded(true);
      } catch (err) {
        console.error(err);
        setError("검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    },
    [keyword]
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
        rootMargin: "150px",
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

  // 상세 페이지 이동 (웨딩홀 모바일뷰 패턴 참고)
  const handleCardClick = useCallback(
    (id: string) => {
      // 실제 상세페이지 경로에 맞게 수정
      navigate(`/product/${id}`);
    },
    [navigate]
  );

  if (!keyword) return null;

  return (
    <div className="relative w-full min-h-screen bg-white">
      {/* 상단 결과 개수 */}
      <div className="pt-1 px-5 flex items-center justify-between">
        <div className="text-[14px] leading-[150%] tracking-[-0.2px] text-[#999999]">
          {initialLoaded && displayCount === 0 ? "" : `총 ${displayCount}개`}
        </div>
        {/* 정렬 영역 (웨딩홀 페이지 스타일 맞춤용, 실제 정렬 추가 가능) */}
        <button className="flex items-center gap-1 active:scale-95">
          <span className="text-[14px] text-black">최신순</span>
          <Icon
            icon="solar:alt-arrow-down-linear"
            className="w-4 h-4 text-[#999999]"
          />
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-4 px-5 text-[13px] text-red-500">{error}</div>
      )}

      {/* 카드 그리드 (웨딩홀 MobileView 스타일 참고 적용) */}
      {!error && (
        <>
          <div className="mt-6 px-5 grid grid-cols-2 gap-y-5 gap-x-2.5 w-full">
            {items.map((it) => {
              const hasBadges = !!it.badges?.length;

              return (
                <div
                  key={it.id}
                  className="w-full flex flex-col gap-2 cursor-pointer"
                  onClick={() => handleCardClick(it.id)}
                >
                  {/* 썸네일 영역 */}
                  <div className="relative w-full aspect-[176/170] overflow-hidden rounded-[12px] bg-[#F3F4F5]">
                    <img
                      src={it.img}
                      alt={it.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {it.heart && (
                      <button
                        aria-label="wish"
                        className="absolute right-2 top-2 w-5 h-5 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Icon
                          icon="solar:heart-bold"
                          className="w-5 h-5 text-[#FF4D6A] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                        />
                      </button>
                    )}
                  </div>

                  {/* 텍스트 영역 */}
                  <div className="flex flex-col gap-[3px] w-full">
                    {/* 브랜드 */}
                    <div className="text-[12px] leading-[150%] tracking-[-0.2px] text-[#999999] truncate">
                      {it.brand}
                    </div>

                    {/* 제목 */}
                    <div className="text-[14px] leading-[150%] tracking-[-0.2px] text-[#1E2124] line-clamp-2">
                      {it.title}
                    </div>

                    {/* 배지 */}
                    {hasBadges && (
                      <div className="flex flex-row flex-wrap items-start gap-1 mt-[2px]">
                        {it.badges!.map((b, i) => (
                          <div
                            key={i}
                            className="flex flex-row items-center px-2 py-[2px] rounded-[4px]"
                            style={{ background: b.bg }}
                          >
                            <span
                              className="text-[10px] font-semibold leading-[150%] tracking-[-0.2px]"
                              style={{ color: b.color }}
                            >
                              {b.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 가격 */}
                    <div className="text-[15px] font-semibold leading-[160%] tracking-[-0.2px] text-[#000000]">
                      {it.price}
                    </div>
                  </div>

                  {/* 조회수 */}
                  {it.views && (
                    <div className="text-[11px] leading-[150%] tracking-[-0.1px] text-[#999999]">
                      {it.views}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 스켈레톤: 초기 로딩 시 */}
            {loading &&
              items.length === 0 &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="animate-pulse w-full flex flex-col gap-2"
                >
                  <div className="w-full aspect-[176/170] rounded-[12px] bg-gray-100" />
                  <div className="h-3 w-2/5 rounded bg-gray-100" />
                  <div className="h-3 w-4/5 rounded bg-gray-100" />
                  <div className="h-4 w-1/2 rounded bg-gray-100" />
                </div>
              ))}
          </div>

          {/* 인피니트 스크롤 센티넬 */}
          <div ref={sentinelRef} className="w-full h-4" />

          {/* 로딩 표시 (추가 페이지) */}
          {loading && items.length > 0 && (
            <div className="pb-8 pt-2 text-center">
              <p className="text-[12px] text-[#595F63]">불러오는 중…</p>
            </div>
          )}

          {/* 마지막 안내 */}
          {!loading && !hasMore && items.length > 0 && (
            <div className="pb-8 pt-2 text-center">
              <p className="text-[12px] text-[#999999]">마지막 상품입니다.</p>
            </div>
          )}

          {/* 결과 없음 */}
          {initialLoaded && !loading && items.length === 0 && !error && (
            <div className="mt-8 px-5 text-[13px] text-[#999999] text-center">
              검색 조건에 맞는 상품이 없습니다.
            </div>
          )}
        </>
      )}
    </div>
  );
}
