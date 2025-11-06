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

/* ========================= 타입 가드 ========================= */

const isProductArray = (val: unknown): val is Product[] =>
  Array.isArray(val) && val.every((v) => typeof v === "object" && v !== null);

const isPageMeta = (val: unknown): val is PageMeta => {
  if (!val || typeof val !== "object") return false;
  const m = val as Record<string, unknown>;
  return (
    typeof m.size === "number" &&
    typeof m.number === "number" &&
    typeof m.totalElements === "number" &&
    typeof m.totalPages === "number"
  );
};

const isPagedResponse = (val: unknown): val is PagedResponse => {
  if (!val || typeof val !== "object") return false;
  const o = val as Record<string, unknown>;
  return isProductArray(o.content) && isPageMeta(o.page);
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

/* ========================= 공통 상수/유틸(컴포넌트 밖으로 이동) ========================= */

const SIZE = 6; // 사이즈 고정(클로저/의존성 꼬임 방지)

/** 파싱 결과 타입 (컴포넌트 외부로 이동) */
type ParsedResult = {
  list: Product[];
  totalElements: number | null;
  pageNumberFromServer: number | null;
  hasMore: boolean;
};

/** 응답 파싱 (컴포넌트 외부로 이동) */
const parseResponse = (resp: unknown, currentPage: number): ParsedResult => {
  // PagedResponse 케이스
  if (isPagedResponse(resp)) {
    const content = resp.content;
    const meta = resp.page;
    const total = meta?.totalElements ?? null;
    const totalPages = meta?.totalPages ?? null;

    return {
      list: content,
      totalElements: total,
      pageNumberFromServer:
        typeof meta?.number === "number" ? meta.number : null,
      hasMore:
        typeof totalPages === "number"
          ? currentPage + 1 < totalPages
          : content.length === SIZE,
    };
  }

  // { content, page } 형태이지만 타입 느슨한 케이스
  if (resp && typeof resp === "object") {
    const obj = resp as Record<string, unknown>;

    const maybeContent = obj.content;
    if (isProductArray(maybeContent)) {
      const meta = obj.page;
      const metaOk = isPageMeta(meta) ? meta : undefined;
      const total = metaOk?.totalElements ?? null;
      const totalPages = metaOk?.totalPages ?? null;

      return {
        list: maybeContent,
        totalElements: total,
        pageNumberFromServer:
          typeof metaOk?.number === "number" ? metaOk.number : null,
        hasMore:
          typeof totalPages === "number"
            ? currentPage + 1 < totalPages
            : maybeContent.length === SIZE,
      };
    }

    // 흔한 래핑: { data: ... }
    if ("data" in obj) {
      return parseResponse(obj.data, currentPage);
    }
  }

  // 배열 응답 케이스
  if (isProductArray(resp)) {
    return {
      list: resp,
      totalElements: null,
      pageNumberFromServer: null,
      hasMore: resp.length === SIZE,
    };
  }

  // 알 수 없는 응답
  return {
    list: [],
    totalElements: null,
    pageNumberFromServer: null,
    hasMore: false,
  };
};

/** 요청 유틸: 0-base 기본, 필요 시 1-base 재시도 (컴포넌트 외부로 이동) */
const requestPage = async (
  nextPage: number,
  forceOneBased = false
): Promise<ParsedResult> => {
  const page0 = forceOneBased ? nextPage + 1 : nextPage;

  const params0 = {
    page: page0, // 일부 서버는 page(0 or 1-base)
    number: page0, // 일부 서버는 number 사용
    pageNumber: page0, // 일부 서버는 pageNumber 사용
    pageNo: nextPage + 1, // 일부 서버는 pageNo(1-base) 사용
    offset: page0 * SIZE, // 일부 서버는 offset 사용
    size: SIZE,
    sort: "createdAt,desc",
  };

  // 디버그 로그는 유지(기능 동일)
  console.log(
    "[fetchPage] 호출 파라미터:",
    params0,
    "(forceOneBased:",
    forceOneBased,
    ")"
  );

  // 응답 타입은 알 수 없으므로 unknown으로 안전 수신
  const response = await api.get<unknown>("/api/v1/wedding-hall", {
    params: params0,
  });

  const raw = (response as { data?: unknown })?.data ?? response;

  return parseResponse(raw, nextPage);
};

/* ========================= 메인 뷰 ========================= */

const MobileView: React.FC = () => {
  const navigate = useNavigate();

  // 데이터 상태
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // 최초 로딩
  const [isFetching, setIsFetching] = useState<boolean>(false); // 추가 페이지 로딩
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 페이지 상태
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalElements, setTotalElements] = useState<number | null>(null);

  // 잠금/참조
  const fetchingLockRef = useRef<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listWrapRef = useRef<HTMLDivElement | null>(null);

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

  /* ===== 실제 페이지 패치 =====
     requestPage가 컴포넌트 밖으로 나가서, 의존성 배열에 포함할 필요가 없어졌습니다. */
  const fetchPage = useCallback(
    async (nextPage: number) => {
      if (fetchingLockRef.current || !hasMore) return;

      fetchingLockRef.current = true;
      setIsFetching(true);
      setErrorMsg("");
      if (nextPage === 0) setLoading(true);

      try {
        // 1차: 0-base 시도
        const beforeCount = items.length;
        const res0 = await requestPage(nextPage, false);

        let list = res0.list;
        let more = res0.hasMore;
        let totalFromServer = res0.totalElements;
        const pageFromServer = res0.pageNumberFromServer;

        // 병합(중복 제거)
        setItems((prev) => {
          const map = new Map<number, Product>();
          prev.forEach((p) => map.set(p.id, p));
          list.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });

        // 0-base가 의심스러울 때(계속 0페이지만 오거나 아이템 증가 없음) → 1-base 재시도 1회
        const noGrowth = beforeCount === items.length && list.length > 0; // 병합 전후 길이가 같음
        const looksStuckOnFirst =
          nextPage > 0 && (pageFromServer === 0 || pageFromServer === null);

        if ((noGrowth || looksStuckOnFirst) && nextPage > 0) {
          console.warn("[fetchPage] 0-base 의심 → 1-base 재시도");
          const res1 = await requestPage(nextPage, true);

          // 재시도 결과가 다르면 다시 병합
          if (res1.list.length) {
            setItems((prev) => {
              const map = new Map<number, Product>();
              prev.forEach((p) => map.set(p.id, p));
              res1.list.forEach((p) => map.set(p.id, p));
              return Array.from(map.values());
            });
            list = res1.list;
            more = res1.hasMore;
            totalFromServer = res1.totalElements ?? totalFromServer;
          }
        }

        if (totalFromServer !== null) setTotalElements(totalFromServer);
        setHasMore(more);
        setPage(nextPage);
      } catch (err) {
        // 에러 메시지 안전 추출
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (err as { message?: string })?.message ||
          "웨딩홀 목록을 불러오지 못했습니다.";
        console.error("[fetchPage] 에러:", msg, err);
        setErrorMsg(msg);
      } finally {
        fetchingLockRef.current = false;
        setIsFetching(false);
        setLoading(false);
      }
    },
    [hasMore, items.length]
  );

  // 초기 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchPage(0);
    })();
    return () => {
      mounted = false;
    };
  }, [fetchPage]);

  // 콘텐츠가 화면을 못 채우면 자동 프리패치
  useEffect(() => {
    if (loading) return;
    const id = requestAnimationFrame(() => {
      const wrap = listWrapRef.current || document.body;
      const contentHeight = wrap.scrollHeight;
      const viewport = window.innerHeight;
      if (contentHeight < viewport && hasMore && !fetchingLockRef.current) {
        console.log("[autoPrefetch] 화면 부족 → 다음 페이지 미리 요청");
        fetchPage(page + 1);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [loading, items.length, hasMore, page, fetchPage]);

  // IntersectionObserver (무한스크롤)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (hasMore && !fetchingLockRef.current) {
          console.log("[IO] 센티넬 진입 → 다음 페이지 요청");
          fetchPage(page + 1);
        }
      },
      { root: null, rootMargin: "200px 0px", threshold: 0 }
    );

    observer.observe(el);
    return () => {
      observer.unobserve(el);
      observer.disconnect();
    };
  }, [page, hasMore, fetchPage]);

  const totalCount = useMemo(
    () => totalElements ?? items.length,
    [items.length, totalElements]
  );

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

      {/* 상태 */}
      {loading && (
        <motion.div className="px-5 mt-2" variants={fadeUp}>
          <p className="text-sm text-[#595F63]">불러오는 중…</p>
        </motion.div>
      )}
      {!!errorMsg && !loading && (
        <motion.div className="px-5 mt-2" variants={fadeUp}>
          <p className="text-sm text-red-500">{errorMsg}</p>
        </motion.div>
      )}

      {/* 리스트 */}
      {!errorMsg && (
        <motion.div
          ref={listWrapRef}
          className="grid grid-cols-2 gap-y-5 gap-x-2.5 px-5 mt-4 pb-24"
          variants={stagger(0.03)}
        >
          {items.map((product) => (
            <Card
              key={product.id}
              product={product}
              liked={likedIds.has(product.id)}
              onToggleLike={toggleLike}
            />
          ))}

          {/* 다음 페이지 로딩 스켈레톤 */}
          {isFetching && !loading && (
            <>
              {Array.from({ length: 2 }).map((_, i) => (
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
            </>
          )}
        </motion.div>
      )}

      {/* 센티넬 */}
      <div ref={sentinelRef} className="h-4 w-full" />

      {/* 끝 문구 */}
      {!loading && !errorMsg && !hasMore && items.length > 0 && (
        <div className="px-5 py-6 text-center text-xs text-[#999999]">
          더 볼 웨딩홀이 없습니다.
        </div>
      )}

      <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </motion.div>
  );
};

export default MobileView;
