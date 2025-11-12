import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SideMenu from "../../../components/SideMenu";
import type { Product } from "../../../type/product";
import api from "../../../lib/api/axios";
import { useAppSelector } from "../../../store/hooks";
import ProductCard from "../../../components/ProductCard";

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

const dimVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 0.7, transition: { duration: 0.25, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_OUT } },
};

const bottomSheetVariants: Variants = {
  hidden: { y: "100%" },
  show: {
    y: 0,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
  exit: {
    y: "100%",
    transition: { duration: 0.26, ease: EASE_OUT },
  },
};

/* ========================= 지역 데이터 ========================= */

type RegionItem =
  | { key: "전체"; label: "전체"; image?: undefined }
  | { key: string; label: string; image: string };

const regions: RegionItem[] = [
  { key: "전체", label: "전체" },
  { key: "서울", label: "서울", image: "/images/seoul.png" },
  { key: "경기", label: "경기", image: "/images/gyeonggi.png" },
  { key: "인천", label: "인천", image: "/images/incheon.png" },
  { key: "부산", label: "부산", image: "/images/busan.png" },
];

/* ========================= 필터 옵션 ========================= */

const STYLE_OPTIONS = ["인물중심", "배경다양", "인물+배경"] as const;
const SHOOTABLE_OPTIONS = [
  "한옥",
  "가든",
  "야간",
  "로드",
  "수중",
  "반려동물",
] as const;

type StyleOption = (typeof STYLE_OPTIONS)[number];
type ShootableOption = (typeof SHOOTABLE_OPTIONS)[number];

/* ========================= API 응답 타입 ========================= */

type PageMeta = {
  size: number;
  number: number; // 현재 페이지 (0-base)
  totalElements: number;
  totalPages: number;
};

type PagedResponse = {
  content: Product[];
  page: PageMeta;
};

/* ========================= 메인 뷰 ========================= */

const MobileView: React.FC = () => {
  const navigate = useNavigate();
  const isAuth = useAppSelector((s) => s.user.isAuth);

  // 데이터 상태
  const [items, setItems] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 찜
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const toggleLike = useCallback((id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // 상세 페이지 이동
  const goDetail = useCallback(
    (id: number) => {
      navigate(`/wedding/${id}`);
    },
    [navigate]
  );

  // 메뉴
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const openMenu = useCallback(() => setIsMenuOpen(true), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  // 필터 Bottom Sheet
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [styleFilter, setStyleFilter] = useState<StyleOption | null>(null);
  const [shootableFilter, setShootableFilter] = useState<ShootableOption[]>([]);

  const openFilter = useCallback(() => setIsFilterOpen(true), []);
  const closeFilter = useCallback(() => setIsFilterOpen(false), []);

  const handleToggleStyle = useCallback((opt: StyleOption) => {
    setStyleFilter((prev) => (prev === opt ? null : opt));
  }, []);

  const handleToggleShootable = useCallback((opt: ShootableOption) => {
    setShootableFilter((prev) =>
      prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt]
    );
  }, []);

  const handleResetFilter = useCallback(() => {
    setStyleFilter(null);
    setShootableFilter([]);
  }, []);

  // 필터 적용 (API 파라미터는 실제 스펙에 맞게 조정하면 됨)
  const handleApplyFilter = useCallback(() => {
    setItems([]);
    setHasMore(true);
    setPageNumber(1);
    closeFilter();
  }, [closeFilter]);

  const onBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }, [navigate]);

  const goSearch = useCallback(() => navigate("/search"), [navigate]);
  const goCart = useCallback(() => navigate("/cart"), [navigate]);

  // 메뉴/필터 열릴 때 바디 스크롤 잠금
  useEffect(() => {
    const original = document.body.style.overflow;
    if (isMenuOpen || isFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = original || "";
    }
    return () => {
      document.body.style.overflow = original || "";
    };
  }, [isMenuOpen, isFilterOpen]);

  /* ===== 페이지네이션 & 무한 스크롤 ===== */

  const [pageNumber, setPageNumber] = useState(1); // 1-base
  const pageSize = 6;
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const fetchingRef = useRef(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const fetchMoreItems = useCallback(
    async (page: number) => {
      if (fetchingRef.current || !hasMore) return;
      fetchingRef.current = true;

      const isInitial = page === 1;
      if (isInitial) setLoadingInitial(true);
      else setIsLoadingMore(true);

      setErrorMsg("");

      try {
        const { data }: { data: PagedResponse } = await api.get(
          "/api/v1/wedding-hall/filter",
          {
            params: {
              pageNumber: page,
              pageSize,
              style: styleFilter || undefined,
              shootable:
                shootableFilter.length > 0
                  ? shootableFilter.join(",")
                  : undefined,
            },
          }
        );

        setTotalCount(data.page.totalElements);

        setItems((prev) => {
          const map = new Map<number, Product>();
          prev.forEach((p) => map.set(p.id, p));
          data.content.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });

        const nextPage = page + 1;
        const more = nextPage <= data.page.totalPages;
        setHasMore(more);
      } catch (err) {
        console.log(err);
        setErrorMsg("목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoadingInitial(false);
        setIsLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [hasMore, pageSize, styleFilter, shootableFilter]
  );

  useEffect(() => {
    fetchMoreItems(pageNumber);
  }, [pageNumber, fetchMoreItems]);

  // 인터섹션 옵저버
  useEffect(() => {
    const target = elementRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (
          firstEntry.isIntersecting &&
          hasMore &&
          !loadingInitial &&
          !isLoadingMore &&
          !fetchingRef.current
        ) {
          setPageNumber((prev) => prev + 1);
        }
      },
      {
        threshold: 0.2,
        rootMargin: "200px 0px",
      }
    );

    observer.observe(target);
    return () => observer.unobserve(target);
  }, [hasMore, loadingInitial, isLoadingMore]);

  const activeFilterCount = (styleFilter ? 1 : 0) + shootableFilter.length;

  const applyButtonLabel =
    activeFilterCount > 0 ? `${totalCount || ""}개 결과 보기` : "결과 보기";

  /* ===== 렌더 ===== */

  return (
    <motion.div
      className="relative w-full min-h-screen bg-white overflow-x-hidden font-['Pretendard']"
      variants={stagger()}
      initial="hidden"
      animate="show"
    >
      {/* 헤더 */}
      <motion.header
        className="relative w-full h-[60px]"
        variants={fadeUp}
        aria-label="상단 헤더"
      >
        <motion.button
          aria-label="back"
          className="absolute left-5 top-[18px] grid place-items-center w-6 h-6 rounded active:scale-95"
          onClick={onBack}
          whileTap={{ scale: 0.94 }}
        >
          <Icon
            icon="icon-park-outline:left"
            className="w-6 h-6 text-[#1E2124]"
          />
        </motion.button>
        <motion.h1
          className="absolute left-1/2 -translate-x-1/2 top-[15.5px] text-center text-[18px] font-semibold leading-[29px] tracking-[-0.2px] text-[#1E2124]"
          variants={fade}
        >
          웨딩홀
        </motion.h1>
        <div className="absolute right-5 top-[18px] flex items-center gap-[12px]">
          <motion.button
            aria-label="search"
            className="grid place-items-center w-6 h-6 rounded hover:bg-black/5 active:scale-95"
            onClick={goSearch}
            whileTap={{ scale: 0.94 }}
          >
            <Icon
              icon="iconamoon:search-light"
              className="w-6 h-6 text-black/80"
            />
          </motion.button>
          {isAuth && (
            <motion.button
              aria-label="cart"
              className="grid place-items-center w-6 h-6 rounded hover:bg-black/5 active:scale-95"
              onClick={goCart}
              whileTap={{ scale: 0.94 }}
            >
              <Icon
                icon="solar:cart-large-minimalistic-linear"
                className="w-6 h-6 text-black/80"
              />
            </motion.button>
          )}
          <motion.button
            aria-label="menu"
            className="grid place-items-center w-6 h-6 rounded hover:bg-black/5 active:scale-95"
            onClick={openMenu}
            whileTap={{ scale: 0.94 }}
          >
            <Icon icon="mynaui:menu" className="w-6 h-6 text-black/80" />
          </motion.button>
        </div>
      </motion.header>

      {/* 지역 */}
      <motion.div
        className="grid grid-cols-5 gap-4 px-5 mt-4 justify-items-center"
        variants={stagger(0.05)}
      >
        {regions.map((r) => (
          <motion.div
            key={r.key}
            className="flex flex-col items-center gap-3 isolate"
            variants={fadeUp}
          >
            <div className="w-[60px] h-[60px] rounded-full border border-[#F2F2F2] bg-white relative overflow-hidden grid place-items-center">
              {r.label === "전체" ? (
                <div className="grid grid-cols-2 gap-[6px]">
                  <span className="w-2 h-2 rounded-full bg-[#595F63]" />
                  <span className="w-2 h-2 rounded-full bg-[#D9D9D9]" />
                  <span className="w-2 h-2 rounded-full bg-[#D9D9D9]" />
                  <span className="w-2 h-2 rounded-full bg-[#595F63]" />
                </div>
              ) : (
                <img
                  src={r.image}
                  alt={`${r.label} 대표 이미지`}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              )}
            </div>
            <p className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
              {r.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* 총 개수 & 정렬/필터 */}
      <motion.div
        className="px-5 my-7 flex items-center justify-between"
        variants={fadeUp}
      >
        <div className="flex">
          <p className="text-[14px] text-[#999999]">총</p>&nbsp;
          <p className="text-[14px] text-black">{totalCount}개</p>
        </div>
        <div className="flex gap-3">
          <button
            className="flex items-center gap-1 active:scale-95"
            onClick={openFilter}
          >
            <span className="text-[14px] text-black">
              필터
              {activeFilterCount > 0 && (
                <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-[#FF2233]/10 text-[#FF2233] align-middle">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <Icon
              icon="solar:tuning-2-linear"
              className="w-4 h-4 text-[#1E2124]"
            />
          </button>
          <button className="flex items-center gap-1 active:scale-95">
            <span className="text-[14px] text-black">최신순</span>
            <Icon
              icon="solar:alt-arrow-down-linear"
              className="w-4 h-4 text-[#1E2124]"
            />
          </button>
        </div>
      </motion.div>

      {/* 상태 */}
      {!!errorMsg && !loadingInitial && (
        <motion.div className="px-5 mt-2" variants={fadeUp}>
          <p className="text-sm text-red-500">{errorMsg}</p>
        </motion.div>
      )}

      {/* 리스트 */}
      {!errorMsg && (
        <>
          <motion.div
            className="grid grid-cols-2 gap-y-5 gap-x-2.5 px-5 mt-4 pb-12"
            variants={stagger(0.03)}
          >
            {items.map((product) => (
              <ProductCard
                key={`p-${product.id}`}
                product={product}
                liked={likedIds.has(product.id)}
                onToggleLike={toggleLike}
                onClick={() => goDetail(product.id)}
              />
            ))}

            {loadingInitial &&
              items.length === 0 &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="animate-pulse w-full flex flex-col gap-2"
                >
                  <div className="w-full aspect-[176/170] rounded-lg bg-gray-100" />
                  <div className="h-3 w-2/5 rounded bg-gray-100" />
                  <div className="h-3 w-4/5 rounded bg-gray-100" />
                  <div className="h-4 w-1/2 rounded bg-gray-100" />
                </div>
              ))}
          </motion.div>

          {/* 무한스크롤 트리거 */}
          <div ref={elementRef} className="h-1" />

          {isLoadingMore && (
            <motion.div className="pb-24 text-center" variants={fade}>
              <p className="text-sm text-[#595F63]">불러오는 중…</p>
            </motion.div>
          )}

          {!hasMore && items.length > 0 && !isLoadingMore && (
            <motion.div className="pb-24 text-center" variants={fade}>
              <p className="text-sm text-[#999999]">마지막 상품입니다.</p>
            </motion.div>
          )}
        </>
      )}

      {/* 필터 Bottom Sheet */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            {/* Dimmed */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/70"
              variants={dimVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={closeFilter}
            />
            {/* Sheet: 반응형 전체 너비 */}
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 w-full bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.18)]"
              variants={bottomSheetVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <span className="text-[18px] font-semibold text-[#1E2124]">
                  필터
                </span>
                <button
                  className="w-6 h-6 grid place-items-center rounded-full active:scale-95"
                  onClick={closeFilter}
                >
                  <Icon icon="mdi:close" className="w-5 h-5 text-[#1E2124]" />
                </button>
              </div>

              {/* 필터 내용: 높이 고정 380px + 내부 스크롤 */}
              <div className="px-5 pb-4 border-t border-[#F3F3F3] h-[380px] overflow-y-auto space-y-6">
                {/* 스타일 */}
                <div className="space-y-3">
                  <p className="text-[16px] font-semibold text-[#1E2124]">
                    스타일
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((label) => {
                      const active = styleFilter === label;
                      return (
                        <button
                          key={label}
                          className={`px-3 py-2 rounded-full text-[14px] border transition-all ${
                            active
                              ? "bg-[#FFF2F2] border-[#FF4E5C] text-[#FF4E5C]"
                              : "bg-white border-[#D9D9D9] text-[#999999]"
                          }`}
                          onClick={() => handleToggleStyle(label)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full h-px bg-[#F3F3F3]" />

                {/* 촬영 가능 */}
                <div className="space-y-3">
                  <p className="text-[16px] font-semibold text-[#1E2124]">
                    촬영 가능
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SHOOTABLE_OPTIONS.map((label) => {
                      const active = shootableFilter.includes(label);
                      return (
                        <button
                          key={label}
                          className={`px-3 py-2 rounded-full text-[14px] border transition-all ${
                            active
                              ? "bg-[#FFF2F2] border-[#FF4E5C] text-[#FF4E5C]"
                              : "bg-white border-[#D9D9D9] text-[#999999]"
                          }`}
                          onClick={() => handleToggleShootable(label)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="flex items-center gap-3 px-5 py-4 border-t border-[#E8E8E8] bg-white">
                <button
                  className="flex-1 h-14 flex items-center justify-center gap-2 rounded-xl border border-[#E8E8E8] bg-white active:scale-95"
                  onClick={handleResetFilter}
                >
                  <Icon
                    icon="ri:reset-left-fill"
                    className="w-5 h-5 text-[#1E2124]"
                  />
                  <span className="text-[16px] font-semibold text-[#1E2124]">
                    초기화
                  </span>
                </button>
                <button
                  className="flex-[2] h-14 flex items-center justify-center rounded-xl bg-[#FF2233] active:scale-95"
                  onClick={handleApplyFilter}
                >
                  <span className="text-[16px] font-semibold text-white">
                    {applyButtonLabel}
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </motion.div>
  );
};

export default MobileView;
