// src/pages/MainPage/views/WebView.tsx
import { Icon } from "@iconify/react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideMenu from "../../../components/SideMenu";
import type { Product } from "../../../type/product";
import api from "../../../lib/api/axios";

type CategoryKey = "hall" | "studio" | "dress" | "makeup";
type Category = { key: CategoryKey; label: string; icon: string };

type PageMeta = {
  size: number;
  number: number; // 서버가 0-base일 수 있어 방어적으로만 사용
  totalElements: number;
  totalPages: number;
};

type PageResponse<T> = {
  content: T[];
  page?: PageMeta; // 서버가 안 줄 수도 있다고 가정
};

type Props = {
  active: CategoryKey;
  setActive: (key: CategoryKey) => void;
  categories: Category[];
  products: Product[]; // 최초 1페이지(선택)
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

// 🎨 디자인 토큰
const PRIMARY_COLOR = "bg-[#9370DB]";
const PRIMARY_COLOR_TEXT = "text-[#7B61D1]";
const CTA_DARK_BG = "bg-slate-900";
const ACCENT_COLOR_HOVER = "hover:bg-[#F2EEFB]";

// 카테고리별 엔드포인트
const ENDPOINT_BY_CATEGORY: Record<CategoryKey, string> = {
  hall: "/api/v1/wedding-hall/filter",
  studio: "/api/v1/studio/filter",
  dress: "/api/v1/dress/filter",
  makeup: "/api/v1/makeup/filter",
};

// ✅ 카테고리별 상세 페이지 경로 매핑 (모바일과 동일하게)
const DETAIL_PATH_BY_CATEGORY: Record<
  CategoryKey,
  (id: number | string) => string
> = {
  hall: (id) => `/wedding/${id}`,
  studio: (id) => `/studio/${id}`,
  dress: (id) => `/dress/${id}`,
  makeup: (id) => `/makeup/${id}`,
};

// ========================= 태그 한글 매핑 ========================= //

const TAG_LABEL_MAP: Record<string, string> = {
  // 홀타입
  GENERAL: "일반",
  CONVENTION: "컨벤션",
  HOTEL: "호텔",
  HOUSE: "하우스",
  RESTAURANT: "레스토랑",
  HANOK: "한옥",
  CHURCH: "교회/성당",

  // 홀컨셉
  SMALL: "스몰",
  CHAPEL: "채플",
  OUTDOOR_GARDEN: "야외/가든",
  TRADITIONAL_WEDDING: "전통혼례",

  // 스타일
  PORTRAIT_FOCUSED: "인물중심",
  VARIED_BACKGROUND: "배경다양",
  PORTRAIT_AND_BACKGROUND: "인물+배경",

  // 촬영 가능
  GARDEN: "가든",
  NIGHT: "야간",
  ROAD: "로드",
  UNDERWATER: "수중",
  PET_FRIENDLY: "반려동물",

  // 행사
  SHOOTING_AND_CEREMONY: "촬영+본식",
  CEREMONY: "본식",
  SHOOTING: "촬영",

  // 주력소재
  SILK: "실크",
  LACE: "레이스",
  BEADS: "비즈",

  // 제작형태
  DOMESTIC: "국내",
  IMPORTED: "수입",
  DOMESTIC_AND_IMPORTED: "국내+수입",

  // 담당자
  DIRECTOR_OR_CEO: "원장/대표/이사",
  DEPUTY_DIRECTOR: "부원장",
  MANAGER: "실장",
  TEAM_LEADER_OR_DESIGNER: "팀장/디자이너",

  // 메이크업 스타일
  FRUITY_TONE: "과즙/색조",
  CLEAN_AND_BRIGHT: "깨끗/화사",
  CONTOUR_AND_SHADOW: "윤곽/음영",
};

/**
 * 백엔드에서 넘어오는 태그 값을 한글로 변환
 * - 영문 코드(GENERAL, CONVENTION, ...) 은 한글 매핑
 * - 이미 한글로 들어오면 그대로 노출
 */
const mapTagLabel = (value: string): string => {
  if (!value) return "";
  const key = value.toUpperCase();
  return TAG_LABEL_MAP[key] ?? value;
};

type ParsedTag = {
  id: string | number | undefined;
  label: string;
};

// 서버 규격: pageNumber(1-base), pageSize(기본 6)
const DEFAULT_PAGE_SIZE = 6;

export default function WebView({
  active,
  setActive,
  categories,
  products,
  isMenuOpen,
  openMenu,
  closeMenu,
}: Props) {
  const navigate = useNavigate();

  // ====== 무한 스크롤 상태 ======
  const [items, setItems] = useState<Product[]>(
    Array.isArray(products) ? products : []
  );
  const [pageNumber, setPageNumber] = useState<number>(
    Array.isArray(products) && products.length > 0 ? 1 : 0 // 초기 데이터가 있으면 1페이지로 간주
  );
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [errorMore, setErrorMore] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState<boolean>(false);

  // 카테고리 변경 또는 초기 데이터 변경 시 리셋
  useEffect(() => {
    const safe = Array.isArray(products) ? products : [];
    setItems(safe);
    setPageNumber(safe.length > 0 ? 1 : 0);
    setPageSize(DEFAULT_PAGE_SIZE);
    setErrorMore(null);
    setReachedEnd(false);
  }, [active, products]);

  const hasNext = useMemo(() => !reachedEnd, [reachedEnd]);

  // 스크롤 컨테이너 & sentinel
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasNext) return;
    try {
      setLoadingMore(true);
      setErrorMore(null);

      const nextPage = (pageNumber || 0) + 1;
      const endpoint = ENDPOINT_BY_CATEGORY[active];

      const res = await api.get<PageResponse<Product>>(endpoint, {
        params: {
          pageNumber: nextPage,
          pageSize,
        },
      });

      const data = res.data;
      const next = Array.isArray(data?.content) ? data.content : [];

      // 중복 방지
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const n of next) if (!seen.has(n.id)) merged.push(n);
        return merged;
      });

      setPageNumber(nextPage);

      // 서버 메타가 있으면 pageSize 반영(선택)
      if (data?.page?.size) setPageSize(data.page.size);

      // 종료 판단: 응답 개수 < pageSize 이면 끝
      if (next.length < (data?.page?.size ?? pageSize)) {
        setReachedEnd(true);
      }

      // 추가 안전망: 메타가 있으면 totalPages 기준으로도 판단
      if (
        data?.page?.totalPages !== undefined &&
        data?.page?.number !== undefined
      ) {
        const oneBase =
          data.page.number >= 1 ? data.page.number : data.page.number + 1;
        if (oneBase >= data.page.totalPages) setReachedEnd(true);
      }
    } catch (e) {
      console.error(e);
      setErrorMore("더 불러오지 못했습니다.");
    } finally {
      setLoadingMore(false);
    }
  }, [active, hasNext, loadingMore, pageNumber, pageSize]);

  // IntersectionObserver: 세로 스크롤 하단에 닿으면 로드
  useEffect(() => {
    const rootEl = scrollRef.current;
    const targetEl = sentinelRef.current;
    if (!rootEl || !targetEl) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            loadNextPage();
          }
        }
      },
      {
        root: rootEl,
        rootMargin: "300px 0px 300px 0px", // 위/아래 여유로 미리 로드
        threshold: 0.01,
      }
    );

    obs.observe(targetEl);
    return () => obs.disconnect();
  }, [loadNextPage, items.length, active]);

  // 초기 보정: 스크롤이 생기지 않을 정도로 컨텐츠가 적으면 자동으로 더 로드
  useEffect(() => {
    const rootEl = scrollRef.current;
    if (!rootEl) return;
    const needsMore =
      rootEl.scrollHeight <= rootEl.clientHeight && hasNext && !loadingMore;
    if (needsMore) {
      loadNextPage();
    }
  }, [items, hasNext, loadingMore, loadNextPage]);

  const safeCategories = Array.isArray(categories) ? categories : [];
  const formatPrice = (price?: number) =>
    typeof price === "number" && !Number.isNaN(price)
      ? `${price.toLocaleString("ko-KR")}원`
      : null;

  const shortAddress = (addr?: string) =>
    typeof addr === "string" && addr.trim()
      ? addr.split(" ").slice(0, 2).join(" ")
      : "";

  const handleSelect = (key: CategoryKey) => setActive(key);

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[15px] text-black/80">
      {/* 상단 공백(데스크톱 네비 높이 보정) */}
      <div className="hidden h-16 md:block" />

      {/* 모바일 상단 검색/메뉴 */}
      <div className="sticky top-0 z-10 w-full border-b border-black/5 bg-white/70 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-6">
          <div className="flex h-11 w-[calc(100%-60px)] items-center rounded-xl bg-[#F3F4F5] px-4 focus-within:ring-2 focus-within:ring-[#9370DB]/70">
            <Icon icon="tabler:search" className="mr-2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="검색어를 입력해주세요"
              aria-label="검색 입력"
              className="h-full w-full bg-transparent text-sm text-gray-700 placeholder-[#C9CBD1] focus:outline-none"
            />
          </div>
          <button
            aria-label="사이드메뉴 열기"
            onClick={openMenu}
            className="ml-2 shrink-0 rounded-lg p-2 transition hover:bg-black/5 active:scale-95"
          >
            <Icon icon="mynaui:menu" className="h-6 w-6 text-black/80" />
          </button>
        </div>
      </div>

      {/* 본문 */}
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-8">
        {/* 히어로 CTA */}
        <section className="mb-10">
          <button
            onClick={() => navigate("/quotation")}
            className={`group relative flex w-full justify-between overflow-hidden rounded-3xl p-8 text-left text-white shadow-xl transition duration-300 ${CTA_DARK_BG} hover:shadow-2xl hover:scale-[1.004] active:scale-[0.995] md:p-10`}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'url("/images/pattern.svg")',
                backgroundSize: "cover",
              }}
            />
            <div className="relative z-10 flex flex-col items-start">
              <div className="flex items-center text-xl font-extrabold md:text-2xl">
                <Icon
                  icon="solar:star-fall-bold"
                  className="mr-3 h-7 w-7 text-yellow-300 md:h-8 md:w-8"
                />
                <span className="leading-tight">
                  <strong>나만의 맞춤 견적</strong>, 1분 만에 받아보세요
                </span>
              </div>
              <p className="mt-2 text-sm text-white/85 md:text-base">
                조건만 입력하면 AI가 최적 플랜을 제안합니다.
              </p>
            </div>
            <div className="relative z-10 ml-4 flex shrink-0 items-center">
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="h-8 w-8 transition duration-300 group-hover:translate-x-1"
              />
            </div>
          </button>
        </section>

        {/* 타이틀 */}
        <section className="mb-4">
          <h2 className="text-2xl font-bold">
            <span className={`mr-1 ${PRIMARY_COLOR_TEXT}`}>2030</span>
            <span className={PRIMARY_COLOR_TEXT}>신부님</span>
            <span className="mr-1 text-black/80">들의</span>
            <span className="text-black/90">PICK</span>
          </h2>
        </section>

        {/* 카테고리 탭 */}
        <section className="mb-6">
          <div className="flex flex-wrap gap-2">
            {safeCategories.map((c) => {
              const isActive = active === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelect(c.key)}
                  className={[
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#7B61D1] text-white shadow-md ring-1 ring-[#6F55C4]"
                      : "border border-[#E6E2F6] bg-[#F7F5FF] text-[#5C4AA8] hover:bg-[#F1EDFF]",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 상품 그리드 + 사이드 */}
        <section className="grid grid-cols-12 gap-6">
          {/* 상품 그리드 */}
          <div className="col-span-12 lg:col-span-8">
            <div
              ref={scrollRef}
              className={[
                "relative max-h-[980px] overflow-y-auto pr-1 scrollbar-hide lg:max-h-[820px]",
              ].join(" ")}
              aria-label="상품 목록"
              aria-live="polite"
              style={
                {
                  scrollbarGutter: "stable both-edges",
                } as React.CSSProperties
              }
            >
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-3">
                {items.map((p) => {
                  // ✅ 현재 활성 카테고리에 따라 상세 경로 결정 (모바일과 동일)
                  const detailPath =
                    DETAIL_PATH_BY_CATEGORY[active]?.(p.id) ??
                    `/wedding/${p.id}`;

                  return (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onClick={() => navigate(detailPath)}
                      formatPrice={formatPrice}
                      shortAddress={shortAddress}
                    />
                  );
                })}
              </div>

              {/* 무한 스크롤 sentinel */}
              <div
                ref={sentinelRef}
                className="h-px w-full opacity-0"
                aria-hidden
              />
            </div>

            {/* 로딩/에러/끝 배지 */}
            <div className="mt-3 flex gap-2">
              {loadingMore && (
                <span className="inline-flex items-center gap-2 rounded bg-black px-2 py-1 text-xs text-white">
                  <Icon icon="svg-spinners:3-dots-fade" className="h-4 w-4" />더
                  불러오는 중...
                </span>
              )}
              {!loadingMore && errorMore && (
                <span className="inline-flex items-center gap-2 rounded bg-red-600 px-2 py-1 text-xs text-white">
                  <Icon icon="mdi:alert-circle-outline" className="h-4 w-4" />
                  {errorMore}
                </span>
              )}
              {!loadingMore && reachedEnd && items.length > 0 && (
                <span className="inline-flex items-center gap-2 rounded bg-gray-200 px-2 py-1 text-xs text-gray-800">
                  <Icon icon="mdi:check-all" className="h-4 w-4" />
                  마지막 상품까지 표시되었습니다.
                </span>
              )}
            </div>

            <p className="sr-only">
              상품은 한 화면에 최대 9개까지 보여지며, 더 많은 상품은 스크롤하여
              볼 수 있습니다.
            </p>
          </div>

          {/* 오른쪽 사이드 */}
          <aside className="col-span-12 lg:col-span-4">
            <button
              className={`w-full rounded-2xl ${PRIMARY_COLOR} p-5 text-white shadow-md transition duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]`}
              onClick={() => navigate("/event")}
            >
              <div className="flex items-center justify-between text-left">
                <div className="flex items-center">
                  <img
                    src="/images/credit.png"
                    alt="credit"
                    className="mr-3 h-9"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = "0";
                    }}
                  />
                  <span className="text-base font-semibold">
                    신용카드 할인 알아보기
                  </span>
                </div>
                <Icon icon="solar:alt-arrow-right-linear" className="h-6 w-6" />
              </div>
            </button>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold">오늘의 소식</h3>
                <button
                  className="text-[14px] font-medium text-[#7B61D1] hover:underline"
                  onClick={() => navigate("/news")}
                >
                  더보기{" "}
                  <Icon
                    icon="solar:alt-arrow-right-linear"
                    className="inline h-4 w-4"
                  />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    img: "/images/t1.png",
                    cat: "메이크업",
                    title: "요즘 신부 메이크업 트렌드",
                  },
                  {
                    img: "/images/t2.png",
                    cat: "드레스",
                    title: "2025 신상 드레스 컬렉션",
                  },
                  {
                    img: "/images/t3.png",
                    cat: "스튜디오",
                    title: "인생샷 스튜디오 포즈 10",
                  },
                ].map((t, index) => (
                  <button
                    key={index}
                    className={`flex w-full items-center rounded-xl p-2 text-left transition ${ACCENT_COLOR_HOVER} active:scale-[0.99]`}
                    onClick={() => navigate("/news/detail/" + index)}
                  >
                    <img
                      src={t.img}
                      alt={t.title}
                      className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover shadow-sm"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-[#7B61D1]">
                        {t.cat}
                      </h4>
                      <p className="line-clamp-2 text-[15px] font-medium text-black/80">
                        {t.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>

      <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </div>
  );
}

/* =========================
   ProductCard (개선 디자인)
   ========================= */
function ProductCard({
  product,
  onClick,
  formatPrice,
  shortAddress,
}: {
  product: Product;
  onClick: () => void;
  formatPrice: (n?: number) => string | null;
  shortAddress: (s?: string) => string;
}) {
  const thumb =
    product.thumbnail && product.thumbnail.trim() !== ""
      ? product.thumbnail
      : null;

  const priceText = formatPrice(product.price);
  const addrText = shortAddress(product.address);

  // ✅ 태그 한글 매핑 적용 (최대 2개)
  const rawTags = Array.isArray(product.tags) ? product.tags : [];

  const parsedTags: ParsedTag[] = rawTags
    .map((tag) => {
      let base = "";

      if (typeof tag === "string") {
        base = tag;
      } else if (tag && typeof tag === "object") {
        const anyTag = tag as {
          id?: string | number;
          tagName?: string | null;
          name?: string | null;
        };
        base = anyTag.tagName ?? anyTag.name ?? "";
      }

      base = base.trim();
      if (!base) return null;

      const label = mapTagLabel(base);

      const id =
        typeof tag === "object" &&
        tag !== null &&
        "id" in tag &&
        (tag as { id?: string | number }).id !== undefined
          ? (tag as { id?: string | number }).id
          : undefined;

      const result: ParsedTag = {
        id,
        label,
      };

      return result;
    })
    .filter((v): v is ParsedTag => v !== null && v.label.trim().length > 0)
    .slice(0, 2);

  return (
    <article
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#F0EEF8] bg-white shadow-[0_1px_10px_rgba(124,97,209,0.06)] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(124,97,209,0.18)]"
      onClick={onClick}
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3F4F5]">
        {thumb ? (
          <img
            src={thumb}
            alt={product.name || "상품 이미지"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[#B0B0B0]">
            이미지 없음
          </div>
        )}

        {/* 그라데이션 상·하단 오버레이 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* 우상단 퀵 아이콘 */}
        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <span className="rounded-full bg-white/90 p-2 shadow hover:bg-white">
            <Icon icon="solar:heart-linear" className="h-4 w-4 text-black/70" />
          </span>
          <span className="rounded-full bg-white/90 p-2 shadow hover:bg-white">
            <Icon icon="solar:eye-linear" className="h-4 w-4 text-black/70" />
          </span>
        </div>
      </div>

      {/* 텍스트 영역 */}
      <div className="space-y-2 px-3.5 pb-3.5 pt-3">
        {/* 제목 */}
        <h3 className="line-clamp-2 text-[15px] font-semibold text-black/85">
          {product.name ?? "이름 미정"}
        </h3>

        {/* 부제(디테일) */}
        {product.detail ? (
          <p className="line-clamp-1 text-[12.5px] text-black/50">
            {product.detail}
          </p>
        ) : null}

        {/* 태그 칩 (최대 2개, 한글 매핑) */}
        {parsedTags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {parsedTags.map((tag, i) => (
              <span
                key={tag.id ?? `${product.id}-tag-${i}`}
                className="inline-flex items-center gap-1 rounded-full border border-[#E8E6F6] bg-[#F9F8FF] px-2.5 py-1 text-[11px] font-medium text-[#5C4AA8]"
              >
                <Icon icon="solar:hashtag-bold" className="h-3.5 w-3.5" />
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* 메타: 주소/별점/가격 */}
        <div className="mt-1.5 flex items-end justify-between">
          <div className="min-w-0">
            <div className="flex items-center text-[12px] text-black/60">
              {addrText && (
                <>
                  <Icon
                    icon="solar:map-point-bold"
                    className="mr-1 h-3.5 w-3.5"
                  />
                  <span className="truncate">{addrText}</span>
                  <span className="mx-1.5 text-black/20">|</span>
                </>
              )}
              <Icon
                icon="solar:star-bold"
                className="mr-1 h-3.5 w-3.5 text-yellow-500"
              />
              <span className="font-semibold">
                {typeof product.starCount === "number"
                  ? product.starCount
                  : "-"}
              </span>
            </div>
          </div>

          {priceText && (
            <span className="ml-3 shrink-0 rounded-full bg-[#FFF1F1] px-2.5 py-1 text-[12.5px] font-bold text-[#DF3B3B] shadow-sm">
              {priceText}
            </span>
          )}
        </div>
      </div>

      {/* 포커스 링 */}
      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-[#7B61D1]/40 transition group-hover:ring-2" />
    </article>
  );
}
