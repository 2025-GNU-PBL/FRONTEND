import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
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
      // 라우트 규칙에 맞게 경로만 맞춰주면 됨
      // 예: /wedding-hall/:id
      navigate(`/wedding/${id}`);
    },
    [navigate]
  );

  // 메뉴
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const openMenu = useCallback(() => setIsMenuOpen(true), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const onBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }, [navigate]);
  const goSearch = useCallback(() => navigate("/search"), [navigate]);
  const goCart = useCallback(() => navigate("/cart"), [navigate]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = isMenuOpen ? "hidden" : original || "";
    return () => {
      document.body.style.overflow = original || "";
    };
  }, [isMenuOpen]);

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
          `/api/v1/wedding-hall/filter?pageNumber=${page}&pageSize=${pageSize}`
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
    [hasMore]
  );

  // 초기 및 pageNumber 변경 시 데이터 로드
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

  /* ===== 렌더 ===== */

  return (
    <motion.div
      className="relative w-full min-h-screen bg-white mx-auto overflow-x-hidden font-['Pretendard'] max-w-screen-sm"
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

      {/* 총 개수 & 정렬 */}
      <motion.div
        className="px-5 my-7 flex items-center justify-between"
        variants={fadeUp}
      >
        <div className="flex">
          <p className="text-[14px] text-[#999999]">총</p>&nbsp;
          <p className="text-[14px] text-black">{totalCount}개</p>
        </div>
        <button className="flex items-center gap-1 active:scale-95">
          <span className="text-[14px] text-black">최신순</span>
          <Icon
            icon="solar:alt-arrow-down-linear"
            className="w-4 h-4 text-[#999999]"
          />
        </button>
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
                onClick={() => goDetail(product.id)} // ✅ 클릭 시 상세 이동
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

      <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </motion.div>
  );
};

export default MobileView;
