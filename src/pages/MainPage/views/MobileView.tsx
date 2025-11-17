// src/pages/MainPage/views/MobileView.tsx
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SideMenu from "../../../components/SideMenu";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import api from "../../../lib/api/axios";
import type { Product } from "../../../type/product";
import { useAppSelector } from "../../../store/hooks";
import { getUnreadNotificationCount } from "../../../lib/api/notification";

// ===== 타입 선언 =====
type CategoryKey = "hall" | "studio" | "dress" | "makeup";

type Category = { key: CategoryKey; label: string; icon: string };

type PageMeta = {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
};

type PageResponse<T> = {
  content: T[];
  page?: PageMeta;
};

type Props = {
  active: CategoryKey;
  setActive: (key: CategoryKey) => void;
  categories: Category[];
  products: Product[];
  pageMeta: PageMeta | null;
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};
// =====================

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
    transition: {
      delay,
      staggerChildren: 0.06,
      when: "beforeChildren",
    },
  },
});

// 카테고리별 엔드포인트
const ENDPOINT_BY_CATEGORY: Record<CategoryKey, string> = {
  hall: "/api/v1/wedding-hall/filter",
  studio: "/api/v1/studio/filter",
  dress: "/api/v1/dress/filter",
  makeup: "/api/v1/makeup/filter",
};

// 상세 페이지 매핑
const DETAIL_PATH_BY_CATEGORY: Record<
  CategoryKey,
  (id: number | string) => string
> = {
  hall: (id) => `/wedding/${id}`,
  studio: (id) => `/studio/${id}`,
  dress: (id) => `/dress/${id}`,
  makeup: (id) => `/makeup/${id}`,
};

export default function MobileView({
  active,
  setActive,
  categories,
  products,
  pageMeta,
  isMenuOpen,
  openMenu,
  closeMenu,
}: Props) {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((s) => s.user.isAuth);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0); // 장바구니 상품 개수 상태 추가

  useEffect(() => {
    if (isAuthenticated) {
      const fetchUnreadCount = async () => {
        try {
          const count = await getUnreadNotificationCount();
          setUnreadCount(count);
        } catch (error) {
          console.error("Failed to fetch unread notification count:", error);
        }
      };

      fetchUnreadCount();

      const fetchCartCount = async () => {
        try {
          const response = await api.get<number>("/api/v1/cart/count");
          setCartCount(response.data);
        } catch (error) {
          console.error(
            "Failed to fetch cart count (MainPage MobileView):",
            error
          );
        }
      };
      fetchCartCount();
    }
  }, [isAuthenticated]);

  // ====== 무한 스크롤 상태 ======
  const [items, setItems] = useState<Product[]>(products ?? []);

  const DEFAULT_PAGE_SIZE = 6;

  const [pageNumber, setPageNumber] = useState<number>(
    (products?.length ?? 0) > 0 ? 1 : 0
  );
  const [pageSize, setPageSize] = useState<number>(
    pageMeta?.size ?? DEFAULT_PAGE_SIZE
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMore, setErrorMore] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState<boolean>(false);

  useEffect(() => {
    setItems(products ?? []);
    setPageNumber((products?.length ?? 0) > 0 ? 1 : 0);
    setPageSize(pageMeta?.size ?? DEFAULT_PAGE_SIZE);
    setErrorMore(null);
    setReachedEnd(false);
  }, [active, products, pageMeta]);

  const hasNext = useMemo(() => {
    if (pageMeta?.totalPages && pageMeta?.number !== undefined) {
      const currentByMetaOneBase =
        pageMeta.number >= 1 ? pageMeta.number : pageMeta.number + 1;
      return currentByMetaOneBase < pageMeta.totalPages && !reachedEnd;
    }
    return !reachedEnd;
  }, [pageMeta, reachedEnd]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasNext) return;

    try {
      setLoadingMore(true);
      setErrorMore(null);

      const nextPage = (pageNumber || 0) + 1;
      const endpoint = ENDPOINT_BY_CATEGORY[active];

      const res = await api.get<PageResponse<Product>>(endpoint, {
        params: { pageNumber: nextPage, pageSize },
      });

      const data = res.data;
      const next = Array.isArray(data?.content) ? data.content : [];

      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const n of next) if (!seen.has(n.id)) merged.push(n);
        return merged;
      });

      setPageNumber(nextPage);

      if (data?.page?.size) setPageSize(data.page.size);

      if (next.length < (data?.page?.size ?? pageSize)) {
        setReachedEnd(true);
      }

      if (
        data?.page?.totalPages !== undefined &&
        data?.page?.number !== undefined
      ) {
        const metaOneBase =
          data.page.number >= 1 ? data.page.number : data.page.number + 1;
        if (metaOneBase >= data.page.totalPages) setReachedEnd(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMore("더 불러오지 못했습니다.");
    } finally {
      setLoadingMore(false);
    }
  }, [active, hasNext, loadingMore, pageNumber, pageSize]);

  useEffect(() => {
    const rootEl = listRef.current;
    const targetEl = sentinelRef.current;
    if (!rootEl || !targetEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) loadNextPage();
        }
      },
      {
        root: rootEl,
        rootMargin: "0px 300px 0px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(targetEl);
    return () => observer.disconnect();
  }, [loadNextPage, items.length, active]);

  useEffect(() => {
    const rootEl = listRef.current;
    if (!rootEl) return;
    const needsMore =
      rootEl.scrollWidth <= rootEl.clientWidth && hasNext && !loadingMore;
    if (needsMore) loadNextPage();
  }, [items, hasNext, loadingMore, loadNextPage]);

  const icons = [
    { img: "/images/wedding.png", label: "웨딩홀", path: "/wedding" },
    { img: "/images/studio.png", label: "스튜디오", path: "/studio" },
    { img: "/images/makeup.png", label: "메이크업", path: "/makeup" },
    { img: "/images/dress.png", label: "드레스", path: "/dress" },
    { img: "/images/calendar.png", label: "캘린더", path: "/calendar" },
  ] as const;

  return (
    <motion.div
      className="flex flex-col text-lg relative"
      variants={stagger()}
      initial="hidden"
      animate="show"
    >
      {/* 헤더 */}
      <motion.div
        className="flex justify-between items-center m-5"
        variants={fadeUp}
      >
        <h1 className="font-allimjang text-[#FF2233] text-2xl font-bold ">
          웨딩PICK
        </h1>
        <div className="flex gap-3">
          {isAuthenticated && (
            <motion.button
              className="relative flex items-center justify-center hover:opacity-80 active:scale-95"
              onClick={() => navigate("/notification")}
              whileTap={{ scale: 0.94 }}
            >
              <Icon
                icon="solar:bell-linear"
                className="w-6 h-6 text-black/80"
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </motion.button>
          )}
          {isAuthenticated && (
            <motion.button
              className="relative flex items-center justify-center hover:opacity-80 active:scale-95"
              onClick={() => navigate("/cart")}
              whileTap={{ scale: 0.94 }}
            >
              <Icon
                icon="solar:cart-large-minimalistic-linear"
                className="w-6 h-6 text-black/80"
              />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </motion.button>
          )}
          <motion.button
            className="flex items-center justify-center hover:opacity-80 active:scale-95"
            aria-label="메뉴 열기"
            onClick={openMenu}
            whileTap={{ scale: 0.94 }}
          >
            <Icon icon="mynaui:menu" className="w-6 h-6 text-black/80" />
          </motion.button>
        </div>
      </motion.div>

      {/* 바디 */}
      <div className="mx-5.5">
        {/* 검색창 */}
        <motion.div
          variants={fadeUp}
          onClick={() => navigate("/search")}
          className="flex items-center mb-7.5 rounded-[8px] px-4 h-11 bg-[#F3F4F5] hover:outline focus-within:outline hover:outline-blue-500 focus-within:outline-gray-600 active:scale-[0.99] transition"
        >
          <Icon icon="tabler:search" className="w-5 h-5 text-[#D9D9D9] mr-2" />
          <input
            type="text"
            placeholder="검색어를 입력해주세요"
            className="flex-1 text-gray-700 placeholder-[#D9D9D9] text-sm bg-transparent h-full focus:outline-none pointer-events-none"
            readOnly
          />
        </motion.div>

        {/* 상세 페이지 아이콘 */}
        <motion.div
          className="grid grid-cols-5 gap-4 mb-5.5 text-black/80"
          variants={stagger(0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          {icons.map(({ img, label, path }) => (
            <motion.div
              key={label}
              className="flex flex-col items-center"
              variants={fadeUp}
            >
              <motion.button
                onClick={() => navigate(path)}
                className="flex flex-col items-center p-3 rounded-[16px] bg-[#F3F4F5] text-gray-700 hover:text-blue-500 mb-2 active:scale-95 transition"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <img src={img} alt={label} className="h-6" />
              </motion.button>
              <span className="text-xs">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* 견적 CTA */}
        <motion.button
          variants={fadeUp}
          onClick={() => navigate("/quotation")}
          className="flex items-center justify-between mb-7.5 rounded-[8px] px-4 h-11 bg-[#F3F4F5] hover:outline focus-within:outline hover:outline-blue-500 focus-within:outline-gray-600 w-full text-left"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center">
            <img src="/images/star.png" alt="star" className="h-4.5 w-4.5" />
            <span className="text-sm text-[#333333]">
              &nbsp; 나의 검색 조건으로 견적을 보고 싶다면?
            </span>
          </div>
          <Icon icon="solar:alt-arrow-right-linear" />
        </motion.button>

        {/* 섹션 타이틀 */}
        <motion.div className="font-semibold text-lg mb-4" variants={fadeUp}>
          <span className="text-[#FF2233] mr-0.75">2030</span>
          <span className="text-[#FF2233]">신부님</span>
          <span className="text-black/80 mr-0.75">들</span>
          <span className="text-black/80">PICK</span>
        </motion.div>

        {/* 카테고리 토글 */}
        <motion.div className="flex gap-2 mb-4" variants={stagger(0.02)}>
          {categories.map((c) => {
            const isActive = active === c.key;
            return (
              <motion.button
                key={c.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActive(c.key)}
                className={[
                  "flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-black text-white"
                    : "border border-[#D9D9D9] text-black",
                ].join(" ")}
                whileTap={{ scale: 0.96 }}
                variants={fadeUp}
              >
                {c.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* 가로 리스트 */}
        <div className="-mx-5 px-5">
          <motion.div
            key={active}
            ref={listRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
            style={{ scrollPaddingLeft: 20, scrollSnapType: "x mandatory" }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.25, ease: EASE_OUT },
            }}
          >
            {items.map((p) => {
              const thumb =
                p.thumbnail && p.thumbnail.trim() !== "" ? p.thumbnail : null;
              const rating =
                typeof p.starCount === "number"
                  ? Number(p.starCount).toFixed(1)
                  : "-";
              const region = p.address
                ? p.address.split(" ").slice(0, 2).join(" ")
                : "";

              // 현재 활성 카테고리에 따라 상세 경로 결정
              const detailPath =
                DETAIL_PATH_BY_CATEGORY[active]?.(p.id) ?? `/wedding/${p.id}`;

              return (
                <motion.article
                  key={p.id}
                  className="min-w-[228px] max-w-[228px] bg-white overflow-hidden"
                  variants={fade}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(detailPath)}
                >
                  <div className="w-full h-[144px] bg-[#F3F4F5]">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"; // 에러나면 숨김
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-[#B0B0B0]">
                        이미지 없음
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-black/40 text-sm">
                        {region} <span className="mx-2">|</span>
                        <img
                          src="/images/star2.png"
                          alt="평점"
                          className="h-3 inline-block mb-1 mr-1"
                        />
                        {rating}
                      </h3>
                    </div>
                    {p.name && (
                      <p className="text-black/80 line-clamp-1">{p.name}</p>
                    )}
                  </div>
                </motion.article>
              );
            })}

            <div ref={sentinelRef} className="flex-none w-px h-[1px]" />
          </motion.div>
        </div>

        {/* 로딩/에러/끝 */}
        <div className="relative">
          {loadingMore && (
            <div className="mt-3 inline-flex items-center gap-2 rounded bg-black text-white text-xs px-2 py-1">
              <Icon icon="svg-spinners:3-dots-fade" className="w-4 h-4" />더
              불러오는 중...
            </div>
          )}
          {!loadingMore && errorMore && (
            <div className="mt-3 inline-flex items-center gap-2 rounded bg-red-600 text-white text-xs px-2 py-1">
              <Icon icon="mdi:alert-circle-outline" className="w-4 h-4" />
              {errorMore}
            </div>
          )}
          {!loadingMore && reachedEnd && items.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded bg-gray-200 text-gray-700 text-xs px-2 py-1">
              <Icon icon="mdi:check-all" className="w-4 h-4" />
              마지막 상품까지 표시되었습니다.
            </div>
          )}
        </div>

        {/* 할인 배너 — ★ 여기만 수정 ★ */}
        <motion.div
          variants={fadeUp}
          onClick={() => navigate("/event")}
          className="text-white flex items-center justify-between mt-3 p-4 rounded-[16px] bg-[#A06CFF] hover:outline focus-within:outline hover:outline-blue-500 focus-within:outline-gray-600 cursor-pointer"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center">
            <img src="/images/credit.png" alt="credit" className="h-8 mr-3" />
            <span className="font-semibold text-base">
              신용카드 할인 알아보기
            </span>
          </div>
          <Icon icon="solar:alt-arrow-right-linear" className="h-6 w-6" />
        </motion.div>

        {/* 오늘의 소식 */}
        <div className="mt-10 mb-25">
          <div className="flex items-center justify-between">
            <h1 className="text-[18px] font-semibold">오늘의 소식</h1>
            <motion.div
              className="text-[14px] text-black/30 gap-1.25 hover:underline"
              whileHover={{ x: 2 }}
            >
              <span>더보기</span>
              <Icon
                icon="solar:alt-arrow-right-linear"
                className="h-4 w-4 inline-block"
              />
            </motion.div>
          </div>

          {[
            {
              img: "/images/t1.png",
              cat: "메이크업",
              title: "요즘 신부 메이크업 트랜드",
            },
            {
              img: "/images/t2.png",
              cat: "메이크업",
              title: "요즘 신부 메이크업 트랜드",
            },
            {
              img: "/images/t3.png",
              cat: "메이크업",
              title: "요즘 신부 메이크업 트랜드",
            },
          ].map((t) => (
            <motion.div
              key={t.img}
              className="mt-5 first:mt-8 flex items-center"
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              <img src={t.img} alt="trend" className="h-[60px] inline-block" />
              <div className="ml-3 items-center">
                <h2 className="text-[#8C8C8C] text-sm">{t.cat}</h2>
                <h1 className="text-base">{t.title}</h1>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 사이드 메뉴 */}
      <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </motion.div>
  );
}
