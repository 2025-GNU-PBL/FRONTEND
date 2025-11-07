import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SideMenu from "../../../components/SideMenu";
import type { Product } from "../../../type/product";
import api from "../../../lib/api/axios";

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

/* ========================= 유틸 ========================= */

const formatPrice = (price: number | string) => {
  const num =
    typeof price === "number"
      ? price
      : Number(String(price).replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(num)) return String(price);
  return `${num.toLocaleString("ko-KR")}원`;
};

const getThumb = (p: Product) => p.thumbnail || "/images/placeholder.jpg";

/* ========================= API 응답 타입 ========================= */
/** 서버 메타 정보(페이지네이션) */
type PageMeta = {
  size: number;
  number: number; // 현재 페이지(0-base 가정)
  totalElements: number;
  totalPages: number;
};

/** 페이지형 응답 */
type PagedResponse = {
  content: Product[];
  page: PageMeta;
};

/* ========================= 카드 ========================= */

type CardProps = {
  product: Product;
  liked: boolean;
  onToggleLike: (id: number) => void;
};

const Card: React.FC<CardProps> = ({ product, liked, onToggleLike }) => (
  <motion.div
    className="relative w-full flex flex-col gap-2"
    variants={fadeUp}
    whileHover={{ y: -2 }}
  >
    <div className="relative w-full aspect-[176/170] rounded-lg border border-[#F5F5F5] overflow-hidden">
      <img
        src={getThumb(product)}
        alt={product.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <motion.button
        type="button"
        aria-label={liked ? "찜 해제" : "찜하기"}
        aria-pressed={liked}
        onClick={(e) => {
          e.preventDefault();
          onToggleLike(product.id);
        }}
        className="absolute right-2 top-2 grid place-items-center w-[8%] aspect-square"
        whileTap={{ scale: 0.9 }}
      >
        <motion.span
          key={liked ? "liked" : "unliked"}
          initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] w-full h-full"
        >
          <Icon
            icon={liked ? "solar:heart-bold" : "solar:heart-linear"}
            className={`w-full h-full ${liked ? "text-red-500" : "text-white"}`}
          />
        </motion.span>
      </motion.button>
    </div>

    <div className="flex flex-col gap-1">
      <p className="text-[14px] leading-[21px] tracking-[-0.2px] text-[#999999]">
        {product.ownerName}
      </p>
      <p className="text-[14px] leading-[21px] tracking-[-0.2px] text-black line-clamp-2">
        {product.name}
      </p>
      <div className="mt-1 flex items-center gap-1">
        <img
          src="/images/star2.png"
          alt="평점"
          className="h-3 inline-block mb-[2px]"
          loading="lazy"
        />
        <span className="text-[12px] text-[#595F63]">
          {Number(product.starCount || 0).toFixed(1)}
        </span>
      </div>
      <p className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-black">
        {formatPrice(product.price)}
      </p>
    </div>
  </motion.div>
);

/* ========================= 메인 뷰 ========================= */

const MobileView: React.FC = () => {
  const navigate = useNavigate();

  // 데이터 상태
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // ★ 초기 로딩
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 찜(로컬)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const toggleLike = useCallback((id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

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

  /* ===== (수정) 무한 스크롤 로직 ===== */

  // 1-based API에 맞춰 1로 시작
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // 더 불러올 데이터가 있는지
  const [totalCount, setTotalCount] = useState(0); // API에서 받아올 전체 개수
  const [isLoadingMore, setIsLoadingMore] = useState(false); // ★ 추가 로딩 중 상태

  const elementRef = useRef<HTMLDivElement | null>(null); // 감지할 요소

  // ★★★ StrictMode 중복 실행 방지
  const initialFetchRef = useRef(false);

  // --- 데이터 페칭 함수 ---
  const fetchMoreItems = useCallback(async () => {
    if (isLoadingMore) return;

    const isInitialLoad = page === 1;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setErrorMsg("");

    try {
      const { data }: { data: PagedResponse } = await api.get(
        `/api/v1/studio?pageNumber=${page}&pageSize=6`
      );

      const pageMeta = data.page;

      // ✅ 기존 items와 신규 content를 id로 중복 제거 후 병합
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const dedupedNew = data.content.filter((p) => !seen.has(p.id));
        // 신규 추가 개수에 따라 이후 로직에서 분기할 수 있도록 길이를 리턴용 변수에 보관
        (setItems as any)._lastAddedCount = dedupedNew.length; // 내부 전달용(아래에서 사용)
        return dedupedNew.length ? [...prev, ...dedupedNew] : prev;
      });

      setTotalCount(pageMeta.totalElements);

      // ✅ 신규가 0개면 페이지 증가/추가 로딩 중단 (중복만 왔거나 더 없음)
      const lastAddedCount: number = (setItems as any)._lastAddedCount ?? 0;

      if (lastAddedCount > 0) {
        const nextPage = page + 1;
        if (page < pageMeta.totalPages) {
          setPage(nextPage);
          setHasMore(true);
        } else {
          setHasMore(false);
        }
      } else {
        // 신규가 없으면 더 이상 불러오지 않도록 차단
        // (서버 중복 응답/정렬 변동 등의 경우에도 key 충돌 방지)
        if (page >= pageMeta.totalPages) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error("데이터 로드 실패:", err);
      setErrorMsg("데이터를 불러오는 데 실패했습니다.");
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [page, isLoadingMore]);

  // --- 1. 초기 데이터 로드 ---
  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;
    fetchMoreItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 2. Intersection Observer 설정 ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoadingMore) {
          fetchMoreItems();
        }
      },
      { threshold: 1.0 }
    );

    const currentElement = elementRef.current;
    if (currentElement) observer.observe(currentElement);

    return () => {
      if (currentElement) observer.unobserve(currentElement);
    };
  }, [hasMore, isLoadingMore, fetchMoreItems]);

  /* ===== (끝) ===== */

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
          스튜디오
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
        <button
          className="flex items-center gap-1 active:scale-95"
          onClick={() => {}}
        >
          <span className="text-[14px] text-black">최신순</span>
          <Icon
            icon="solar:alt-arrow-down-linear"
            className="w-4 h-4 text-[#999999]"
          />
        </button>
      </motion.div>

      {/* 상태 (에러) */}
      {!!errorMsg && !loading && (
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
            {/* 1. 불러온 아이템들 */}
            {items.map((product) => (
              <Card
                key={product.id} // ✅ 중복 방지는 위에서 id 기반 dedupe로 해결
                product={product}
                liked={likedIds.has(product.id)}
                onToggleLike={toggleLike}
              />
            ))}

            {/* 2. 로딩 스켈레톤 (초기 로딩 시 + 아이템이 0개일 때만) */}
            {loading &&
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

          {/* 3. Intersection Observer 타겟 + 추가 로딩 스피너 */}
          <div ref={elementRef} className="h-1" />

          {/* 추가 로딩 중일 때 */}
          {isLoadingMore && (
            <motion.div className="pb-24 text-center" variants={fade}>
              <p className="text-sm text-[#595F63]">불러오는 중…</p>
            </motion.div>
          )}

          {/* 더 이상 아이템이 없을 때 */}
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
