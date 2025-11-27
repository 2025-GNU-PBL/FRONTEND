// src/pages/wedding/WebView.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../../type/product";
import api from "../../../lib/api/axios";

/* ========================= 로컬 확장 타입 ========================= */

type ProductTag = {
  id?: number | string;
  tagName: string;
};

type ProductExt = Product & {
  // 서버 응답에 존재할 수 있는 확장 필드들
  thumbnail?: string;
  starCount?: number;
  price?: number | string;
  tags?: ProductTag[];
  ownerName?: string;
};

/* ========================= 애니메이션 유틸 ========================= */

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: EASE_OUT } },
};

const stagger = (delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: { delay, staggerChildren: 0.06, when: "beforeChildren" },
  },
});

/* ========================= 서버 페이징 타입 ========================= */

type PageMeta = {
  size: number;
  number: number; // 현재 페이지(0-base)
  totalElements: number;
  totalPages: number;
};

type PagedResponse = {
  content: ProductExt[];
  page: PageMeta;
};

/* ========================= 지역 데이터 & 매핑 ========================= */
/** ✅ 지역은 '필터'에서 분리하여 상단에 독립 UI로 배치하고 즉시 적용 */
type RegionKey = "전체" | "서울" | "경기" | "인천" | "부산";

type RegionItem =
  | { key: "전체"; label: "전체"; image?: undefined }
  | { key: Exclude<RegionKey, "전체">; label: string; image: string };

const regions: RegionItem[] = [
  { key: "전체", label: "전체" },
  { key: "서울", label: "서울", image: "/images/seoul.png" },
  { key: "경기", label: "경기", image: "/images/gyeonggi.png" },
  { key: "인천", label: "인천", image: "/images/incheon.png" },
  { key: "부산", label: "부산", image: "/images/busan.png" },
];

// 서버 규약: 인천 → ETC
const getRegionQueryValue = (region: RegionKey): string | undefined => {
  if (region === "전체") return undefined;
  if (region === "서울") return "SEOUL";
  if (region === "경기") return "GYEONGGI";
  if (region === "부산") return "BUSAN";
  if (region === "인천") return "INCHEON";
  return undefined;
};

/* ========================= 정렬 옵션 ========================= */

type SortOption = "최신순" | "인기순" | "낮은가격순" | "높은가격순";

const sortToParam = (
  opt: SortOption
): "LATEST" | "POPULAR" | "PRICE_ASC" | "PRICE_DESC" => {
  if (opt === "최신순") return "LATEST";
  if (opt === "인기순") return "POPULAR";
  if (opt === "높은가격순") return "PRICE_DESC";
  return "PRICE_ASC";
};

/* ========================= 태그 필터(모바일과 동일 규약) ========================= */
/** ✅ 모바일처럼 selectedTags(임시)와 appliedTags(실제 적용)를 분리 */
type WeddingTag =
  | "GENERAL"
  | "CONVENTION"
  | "HOTEL"
  | "HOUSE"
  | "RESTARUANT" // 오타 방지용으로 남겨두고 싶다면 이렇게도 가능하지만, 아래에서 RESTAURANT 사용
  | "RESTAURANT"
  | "HANOK"
  | "CHURCH"
  | "CHAPEL"
  | "SMALL"
  | "OUTDOOR_GARDEN"
  | "TRADITIONAL_WEDDING";

const TAG_LABEL: Record<WeddingTag, string> = {
  GENERAL: "일반",
  CONVENTION: "컨벤션",
  HOTEL: "호텔",
  HOUSE: "하우스",
  RESTARUANT: "레스토랑", // 위 타입에 맞게 작성했으면 제거 가능
  RESTAURANT: "레스토랑",
  HANOK: "한옥",
  CHURCH: "교회/성당",
  CHAPEL: "채플",
  SMALL: "스몰",
  OUTDOOR_GARDEN: "야외/가든",
  TRADITIONAL_WEDDING: "전통혼례",
};

const TAG_GROUPS: { title: string; items: WeddingTag[] }[] = [
  {
    title: "홀타입",
    items: [
      "GENERAL",
      "CONVENTION",
      "HOTEL",
      "HOUSE",
      "RESTAURANT",
      "HANOK",
      "CHURCH",
    ],
  },
  {
    title: "홀컨셉",
    items: ["SMALL", "CHAPEL", "OUTDOOR_GARDEN", "TRADITIONAL_WEDDING"],
  },
];

/** ✅ 서버에서 오는 태그 코드(GENERAL 등)를 화면용 한글 라벨로 매핑 */
const getTagLabelFromServer = (code: string): string => {
  // code가 WeddingTag로 들어오는 경우에만 매핑, 아니면 그대로 노출
  return (TAG_LABEL as Record<string, string>)[code] ?? code;
};

/* ========================= 유틸 ========================= */

const formatPrice = (price: number | string | undefined) => {
  if (price === undefined) return "-";
  const num =
    typeof price === "number"
      ? price
      : Number(String(price).replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(num)) return String(price);
  return `${num.toLocaleString("ko-KR")}원`;
};

const getThumb = (p: ProductExt) => p.thumbnail ?? "/images/placeholder.jpg";

function isCanceledError(e: unknown): e is { name?: unknown; code?: unknown } {
  return typeof e === "object" && e !== null && ("name" in e || "code" in e);
}

/* ========================= 카드 ========================= */

type CardProps = {
  product: ProductExt;
  liked: boolean;
  onToggleLike: (id: number) => void;
  onClick: () => void;
};

const Card: React.FC<CardProps> = ({
  product,
  liked,
  onToggleLike,
  onClick,
}) => {
  const ratingText = Number(product.starCount ?? 0).toFixed(1);
  const displayPrice = formatPrice(product.price);
  const tagList: ProductTag[] = product.tags ?? [];

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -2 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="group relative w-full overflow-hidden rounded-2xl border border-[#F1F1F1] bg-white cursor-pointer"
    >
      {/* 이미지 */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <img
          src={getThumb(product)}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* 찜(로컬) */}
        <button
          type="button"
          aria-label={liked ? "찜 해제" : "찜하기"}
          aria-pressed={liked}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation(); // 카드 클릭으로 디테일 이동 방지
            onToggleLike(product.id);
          }}
          className="absolute right-3 top-3 grid aspect-square w-9 place-items-center rounded-full bg-black/45 backdrop-blur text-white transition hover:bg-black/60"
        >
          <Icon
            icon={liked ? "solar:heart-bold" : "solar:heart-linear"}
            className={`h-5 w-5 ${liked ? "text-red-500" : "text-white"}`}
          />
        </button>
      </div>

      {/* 정보 */}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6B7280]">{product.ownerName}</p>
          <div className="flex items-center gap-1">
            <img src="/images/star4.png" alt="평점" className="mb-[2px] h-3" />
            <span className="text-xs text-[#374151]">{ratingText}</span>
          </div>
        </div>

        <h3 className="line-clamp-2 text-base font-medium text-[#111827]">
          {product.name}
        </h3>

        <div className="mt-1 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-[#111827]">
            {displayPrice}
          </p>

          <div className="flex max-w-[60%] flex-wrap items-center gap-1">
            {tagList.slice(0, 2).map((t) => {
              const label = getTagLabelFromServer(t.tagName);
              return (
                <span
                  key={(t.id ?? t.tagName).toString()}
                  className="truncate rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[11px] text-[#4B5563]"
                  title={label}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </motion.article>
  );
};

/* ========================= 웹 뷰 ========================= */

const WebView: React.FC = () => {
  const navigate = useNavigate();

  // 서버 데이터
  const [items, setItems] = useState<ProductExt[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 무한스크롤
  const [pageNumber, setPageNumber] = useState(1); // 1-base
  const pageSize = 12;
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 요청 제어
  const controllerRef = useRef<AbortController | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);
  const prevParamsKeyRef = useRef<string>("");

  // 로컬 상태
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  /** ✅ 지역: 필터와 분리된 독립 상태(선택 즉시 적용) */
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>("전체");

  /** ✅ 정렬: 변경 즉시 적용 */
  const [sortOption, setSortOption] = useState<SortOption>("최신순");

  /** ✅ 태그: 시트/패널 내 선택값과 실제 적용값 분리 */
  const [selectedTags, setSelectedTags] = useState<Set<WeddingTag>>(new Set());
  const [appliedTags, setAppliedTags] = useState<Set<WeddingTag>>(new Set());

  // 서버 파라미터
  const regionParam = useMemo(
    () => getRegionQueryValue(selectedRegion),
    [selectedRegion]
  );
  const sortParam = useMemo(() => sortToParam(sortOption), [sortOption]);
  const tagsParam = useMemo(() => {
    if (appliedTags.size === 0) return undefined;
    return Array.from(appliedTags).join(",");
  }, [appliedTags]);

  // 파라미터 키(응답 가드/리셋 트리거)
  const paramsKey = useMemo(
    () =>
      JSON.stringify({
        region: regionParam ?? null,
        sort: sortParam,
        tags: tagsParam ?? null,
      }),
    [regionParam, sortParam, tagsParam]
  );

  const fetchMore = useCallback(
    async (page: number) => {
      if (fetchingRef.current || !hasMore) return;

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const myKey = paramsKey;
      inFlightKeyRef.current = myKey;
      fetchingRef.current = true;

      const isInitial = page === 1;
      if (isInitial) setLoadingInitial(true);
      else setIsLoadingMore(true);

      setErrorMsg("");

      try {
        const { data } = await api.get<PagedResponse>(
          "/api/v1/wedding-hall/filter",
          {
            params: {
              pageNumber: page,
              pageSize,
              region: regionParam,
              sortType: sortParam,
              tags: tagsParam,
            },
            signal: controller.signal,
          }
        );

        if (inFlightKeyRef.current !== myKey || myKey !== paramsKey) {
          return;
        }

        const nextContent = (data?.content ?? []) as ProductExt[];
        setTotalCount(data?.page?.totalElements ?? 0);

        setItems((prev) => {
          if (isInitial) return nextContent;
          return [...prev, ...nextContent];
        });

        const nextPage = page + 1;
        const more = nextPage <= (data?.page?.totalPages ?? 0);
        setHasMore(more);
      } catch (err: unknown) {
        if (isCanceledError(err)) {
          const n = (err as { name?: unknown }).name;
          const c = (err as { code?: unknown }).code;
          if (n === "CanceledError" || c === "ERR_CANCELED") {
            // 요청 취소는 무시
          } else {
            // 기타 오류
            console.error(err);
            setErrorMsg("목록을 불러오는 중 오류가 발생했습니다.");
          }
        } else {
          console.error(err);
          setErrorMsg("목록을 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (inFlightKeyRef.current === myKey) {
          setLoadingInitial(false);
          setIsLoadingMore(false);
          fetchingRef.current = false;
        }
      }
    },
    [hasMore, pageSize, regionParam, sortParam, tagsParam, paramsKey]
  );

  // 파라미터 변경 시 1페이지부터 리셋
  useEffect(() => {
    if (prevParamsKeyRef.current !== paramsKey && pageNumber !== 1) {
      prevParamsKeyRef.current = paramsKey;
      setItems([]);
      setHasMore(true);
      setTotalCount(0);
      setPageNumber(1);
      return;
    }
    prevParamsKeyRef.current = paramsKey;
    fetchMore(pageNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, pageNumber]);

  // 인터섹션 옵저버
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          hasMore &&
          !loadingInitial &&
          !isLoadingMore &&
          !fetchingRef.current
        ) {
          setPageNumber((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "500px 0px" }
    );

    observer.observe(target);
    return () => observer.unobserve(target);
  }, [hasMore, loadingInitial, isLoadingMore]);

  /* ========================= 핸들러 ========================= */

  // ✅ 지역: 상단에서 선택 즉시 리스트 리셋 + 재요청(모바일과 동일 동작)
  const handleRegionSelect = useCallback((key: RegionKey) => {
    setSelectedRegion(key);
    setItems([]);
    setHasMore(true);
    setTotalCount(0);
    setPageNumber(1);
  }, []);

  // ✅ 정렬: 변경 즉시 적용
  const handleChangeSort = useCallback((opt: SortOption) => {
    setSortOption(opt);
    setItems([]);
    setHasMore(true);
    setTotalCount(0);
    setPageNumber(1);
  }, []);

  // ✅ 태그: 패널 내 임시 선택 토글
  const toggleTag = useCallback((tag: WeddingTag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const resetFilter = useCallback(() => {
    setSelectedTags(new Set());
  }, []);

  // ✅ 태그: 적용 버튼을 눌러야 실제 API 반영(appliedTags로 복사)
  const applyFilter = useCallback(() => {
    setAppliedTags(new Set(selectedTags));
    setItems([]);
    setHasMore(true);
    setTotalCount(0);
    setPageNumber(1);
  }, [selectedTags]);

  // ✅ 태그: 개별 뱃지 X 클릭 시 즉시 해제 + 재요청
  const clearAppliedTag = useCallback((tag: WeddingTag) => {
    setAppliedTags((prev) => {
      const next = new Set(prev);
      next.delete(tag);
      return next;
    });
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.delete(tag);
      return next;
    });
    setItems([]);
    setHasMore(true);
    setTotalCount(0);
    setPageNumber(1);
  }, []);

  const toggleLike = useCallback((id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const goDetail = useCallback(
    (id: number) => {
      navigate(`/wedding/${id}`);
    },
    [navigate]
  );

  const activeFilterCount = appliedTags.size;

  /* ========================= 렌더 ========================= */

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl px-6 pb-16 pt-22"
      variants={stagger()}
      initial="hidden"
      animate="show"
    >
      {/* ===== 컨트롤 바: 지역 칩 + 정렬 + 결과 카운트 ===== */}
      <motion.div
        variants={fadeUp}
        className="mb-6 rounded-2xl border border-[#EEE] bg-[#FCFCFD] p-4 shadow-[0_1px_10px_rgba(15,23,42,0.03)]"
        aria-label="지역 및 정렬 컨트롤"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon icon="solar:map-point-line-duotone" className="h-5 w-5" />
            <h2 className="text-[14px] font-semibold text-[#0F172A] tracking-[-0.2px]">
              지역 선택
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#64748B]">
              {selectedRegion === "전체" ? "전체 지역" : selectedRegion} ·{" "}
              <strong className="text-[#0F172A]">{totalCount}</strong>개
            </span>

            <div className="hidden md:flex items-center gap-2">
              <Icon
                icon="solar:sort-linear"
                className="h-5 w-5 text-[#6B7280]"
              />
              <select
                value={sortOption}
                onChange={(e) => handleChangeSort(e.target.value as SortOption)}
                className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#111827] focus:outline-none"
                aria-label="정렬 선택"
              >
                <option value="최신순">최신순</option>
                <option value="인기순">인기순</option>
                <option value="낮은가격순">가격 낮은순</option>
                <option value="높은가격순">가격 높은순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 지역 칩 */}
        <div className="mt-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#E5E7EB] scrollbar-track-transparent">
            {regions.map((r) => {
              const active = selectedRegion === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleRegionSelect(r.key)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition flex-shrink-0 ${
                    active
                      ? "border-[#FF2233] bg-[#FFF2F2] text-[#FF2233]"
                      : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]"
                  }`}
                  title={r.label}
                >
                  {r.image ? (
                    <img
                      src={r.image}
                      alt={r.label}
                      className="h-4 w-4 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="grid grid-cols-2 gap-[2px] pr-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#595F63]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D9D9D9]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D9D9D9]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#595F63]" />
                    </span>
                  )}
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 모바일 정렬 셀렉트(컨트롤 바 내부로 이동) */}
        <div className="mt-3 flex items-center gap-2 md:hidden">
          <Icon icon="solar:sort-linear" className="h-5 w-5 text-[#6B7280]" />
          <select
            value={sortOption}
            onChange={(e) => handleChangeSort(e.target.value as SortOption)}
            className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] text-[#111827] focus:outline-none"
            aria-label="정렬 선택"
          >
            <option value="최신순">최신순</option>
            <option value="인기순">인기순</option>
            <option value="낮은가격순">가격 낮은순</option>
            <option value="높은가격순">가격 높은순</option>
          </select>
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-6">
        {/* ===== 사이드 패널(필터만 존재하도록 수정) ===== */}
        <motion.aside
          variants={fadeUp}
          className="col-span-12 lg:col-span-3"
          aria-label="필터 패널"
        >
          <div className="sticky top-4 h-100 lg:h-150">
            <div className="flex h-full flex-col rounded-2xl border border-[#ECECEC] bg-white shadow-sm">
              {/* 패널 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F2F2]">
                <h2 className="text-[14px] font-semibold text-[#111827]">
                  검색 필터
                </h2>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#FF2233]/10 px-2 py-0.5 text-[10px] font-medium text-[#FF2233]">
                    {activeFilterCount}
                  </span>
                )}
              </div>

              {/* 스크롤 영역: 태그만 유지 (더보기 제거) */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* 필터 그룹 */}
                <section>
                  <h3 className="mb-2 text-[13px] font-semibold text-[#111827]">
                    필터
                  </h3>

                  <div className="space-y-3">
                    {TAG_GROUPS.map((group) => (
                      <div
                        key={group.title}
                        className="rounded-xl border border-[#F1F1F1] bg-[#FBFBFB]"
                      >
                        <div className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-semibold text-[#1E2124]">
                          <span>{group.title}</span>
                        </div>

                        {/* 내용: 모든 태그를 한 번에 노출 */}
                        <div className="px-3 pb-2">
                          <div className="flex flex-wrap gap-1.5">
                            {group.items.map((tag) => {
                              const active = selectedTags.has(tag);
                              return (
                                <button
                                  key={tag}
                                  onClick={() => toggleTag(tag)}
                                  className={`h-8 rounded-full border px-2.5 text-[12px] transition ${
                                    active
                                      ? "bg-[#FFF2F2] border-[#FF4E5C] text-[#FF4E5C]"
                                      : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
                                  }`}
                                >
                                  {TAG_LABEL[tag]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* 패널 푸터(압축) */}
              <div className="sticky bottom-0 border-t border-[#EDEDED] bg:white px-4 py-3 bg-white">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetFilter}
                    className="flex-1 h-10 rounded-lg border border-[#E5E5E5] bg-white text-[13px] font-semibold text-[#1E2124] transition hover:border-[#D9D9D9]"
                  >
                    초기화
                  </button>
                  <button
                    type="button"
                    onClick={applyFilter}
                    className="flex-[1.3] h-10 rounded-lg bg-[#FF2233] text-[13px] font-semibold text-white transition hover:brightness-[0.98]"
                  >
                    적용
                  </button>
                </div>

                {activeFilterCount > 0 && (
                  <div className="mt-1 text-right">
                    <button
                      onClick={() => {
                        // '전체 초기화'는 태그만 초기화 (지역/정렬은 상단에서 관리하므로 유지)
                        setSelectedTags(new Set());
                        setAppliedTags(new Set());
                        setItems([]);
                        setHasMore(true);
                        setTotalCount(0);
                        setPageNumber(1);
                      }}
                      className="text-[11px] text-[#9CA3AF] underline underline-offset-2 hover:text-[#6B7280]"
                    >
                      필터 전체 초기화
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.aside>

        {/* ===== 리스트 영역 ===== */}
        <div className="col-span-12 lg:col-span-9">
          {/* 적용된 필터 뱃지 (X로 해제) */}
          {activeFilterCount > 0 && (
            <motion.div
              variants={fadeUp}
              className="mb-4 flex flex-wrap items-center gap-2"
            >
              {Array.from(appliedTags).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-[#FFE0E2] bg-[#FFF5F6] px-3 py-1 text-[12px] text-[#FF3B4A]"
                >
                  {TAG_LABEL[t]}
                  <button
                    aria-label="필터 제거"
                    onClick={() => clearAppliedTag(t)}
                    className="grid h-4 w-4 place-items-center rounded-full hover:bg-[#ffe7ea]"
                  >
                    <Icon icon="mdi:close" className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => {
                  setAppliedTags(new Set());
                  setSelectedTags(new Set());
                  setItems([]);
                  setHasMore(true);
                  setTotalCount(0);
                  setPageNumber(1);
                }}
                className="ml-1 text-[12px] text-[#9CA3AF] underline underline-offset-2 hover:text-[#6B7280]"
              >
                모두 해제
              </button>
            </motion.div>
          )}

          {/* 상태 */}
          {!!errorMsg && !loadingInitial && (
            <motion.div variants={fadeUp} className="mb-6">
              <div className="rounded-xl border border-red-100 bg-red-50 p-6">
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
            </motion.div>
          )}

          {/* 카드 그리드: ✅ 무조건 3열 고정 */}
          {!errorMsg && (
            <>
              <motion.div
                variants={stagger(0.02)}
                className="grid grid-cols-3 gap-6"
              >
                {items.map((p) => (
                  <Card
                    key={p.id}
                    product={p}
                    liked={likedIds.has(p.id)}
                    onToggleLike={toggleLike}
                    onClick={() => goDetail(p.id)}
                  />
                ))}

                {loadingInitial &&
                  items.length === 0 &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="animate-pulse w-full flex flex-col gap-2 rounded-2xl border border-[#F3F3F3] bg-white p-4"
                    >
                      <div className="w-full aspect-[4/3] rounded-lg bg-gray-100" />
                      <div className="h-3 w-2/5 rounded bg-gray-100" />
                      <div className="h-3 w-4/5 rounded bg-gray-100" />
                      <div className="h-4 w-1/2 rounded bg-gray-100" />
                    </div>
                  ))}
              </motion.div>

              {/* 무한스크롤 센티넬 */}
              <div ref={sentinelRef} className="h-1" />

              {isLoadingMore && (
                <motion.div className="mt-6 text-center" variants={fade}>
                  <p className="text-sm text-[#595F63]">불러오는 중…</p>
                </motion.div>
              )}

              {!hasMore && items.length > 0 && !isLoadingMore && (
                <motion.div className="mt-8 text-center" variants={fade}>
                  <p className="text-sm text-[#999999]">마지막 상품입니다.</p>
                </motion.div>
              )}

              {!loadingInitial && items.length === 0 && (
                <motion.div
                  variants={fadeUp}
                  className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-10 text-center"
                >
                  <Icon
                    icon="ph:binoculars"
                    className="mb-3 h-8 w-8 text-[#9CA3AF]"
                  />
                  <p className="text-sm text-[#6B7280]">
                    조건에 맞는 웨딩홀을 찾지 못했어요.
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WebView;
