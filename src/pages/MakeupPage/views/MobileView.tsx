import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SideMenu from "../../../components/SideMenu";
import type { Product } from "../../../type/product";
import api from "../../../lib/api/axios";
import { useAppSelector } from "../../../store/hooks";
import ProductCard from "../../../components/ProductCard";
import type { SortOption } from "../../../components/SortBottomSheet";
import SortBottomSheet from "../../../components/SortBottomSheet";
import axios from "axios";

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
  show: { y: 0, transition: { duration: 0.32, ease: EASE_OUT } },
  exit: { y: "100%", transition: { duration: 0.26, ease: EASE_OUT } },
};

/* ========================= 지역 데이터 ========================= */

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

/* ========================= 메이크업 태그 필터 ========================= */

type MakeupTag =
  | "SHOOTING_AND_CEREMONY"
  | "CEREMONY"
  | "SHOOTING"
  | "DIRECTOR_OR_CEO"
  | "DEPUTY_DIRECTOR"
  | "MANAGER"
  | "TEAM_LEADER_OR_DESIGNER"
  | "FRUITY_TONE"
  | "CLEAN_AND_BRIGHT"
  | "CONTOUR_AND_SHADOW";

const TAG_LABEL: Record<MakeupTag, string> = {
  SHOOTING_AND_CEREMONY: "촬영+본식",
  CEREMONY: "본식",
  SHOOTING: "촬영",
  DIRECTOR_OR_CEO: "원장/대표/이사",
  DEPUTY_DIRECTOR: "부원장",
  MANAGER: "실장",
  TEAM_LEADER_OR_DESIGNER: "팀장/디자이너",
  FRUITY_TONE: "과즙/색조",
  CLEAN_AND_BRIGHT: "깨끗/화사",
  CONTOUR_AND_SHADOW: "윤곽/음영",
};

const TAG_GROUPS: { title: string; items: MakeupTag[] }[] = [
  {
    title: "행사",
    items: ["SHOOTING_AND_CEREMONY", "CEREMONY", "SHOOTING"],
  },
  {
    title: "담당자",
    items: [
      "DIRECTOR_OR_CEO",
      "DEPUTY_DIRECTOR",
      "MANAGER",
      "TEAM_LEADER_OR_DESIGNER",
    ],
  },
  {
    title: "메이크업 스타일",
    items: ["FRUITY_TONE", "CLEAN_AND_BRIGHT", "CONTOUR_AND_SHADOW"],
  },
];

/* ========================= API 타입 ========================= */

type PageMeta = {
  size: number;
  number: number; // 현재 페이지(0-base)
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

  // 지역 & 정렬
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>("전체");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("최신순");

  // 필터(시트 내 선택과 실제 적용을 분리)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<MakeupTag>>(new Set()); // 시트 내 임시 선택
  const [appliedTags, setAppliedTags] = useState<Set<MakeupTag>>(new Set()); // 실제 API에 쓰는 태그

  // ✅ 필터 미리보기 결과 개수 상태
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewControllerRef = useRef<AbortController | null>(null);

  // 찜
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const toggleLike = useCallback((id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 네비게이션
  const goDetail = useCallback(
    (id: number) => navigate(`/makeup/${id}`),
    [navigate]
  );
  const onBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }, [navigate]);
  const goSearch = useCallback(() => navigate("/search"), [navigate]);
  const goCart = useCallback(() => navigate("/cart"), [navigate]);

  // 메뉴
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const openMenu = useCallback(() => setIsMenuOpen(true), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  // 시트
  const openFilter = useCallback(() => {
    // 시트 열 때 현재 적용된 태그를 편집용으로 복사
    setSelectedTags(new Set(appliedTags));
    setIsFilterOpen(true);
  }, [appliedTags]);
  const closeFilter = useCallback(() => setIsFilterOpen(false), []);
  const openSort = useCallback(() => setIsSortOpen(true), []);
  const closeSort = useCallback(() => setIsSortOpen(false), []);

  // 바디 스크롤 잠금
  useEffect(() => {
    const original = document.body.style.overflow;
    if (isMenuOpen || isFilterOpen || isSortOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = original || "";
    }
    return () => {
      document.body.style.overflow = original || "";
    };
  }, [isMenuOpen, isFilterOpen, isSortOpen]);

  /* ========================= 쿼리 파라미터 ========================= */

  const getRegionQueryValue = (region: RegionKey): string | undefined => {
    if (region === "전체") return undefined;
    if (region === "서울") return "SEOUL";
    if (region === "경기") return "GYEONGGI";
    if (region === "부산") return "BUSAN";
    if (region === "인천") return "INCHEON"; // 서버 규약 유지
    return undefined;
  };

  const sortParam = useMemo(() => {
    if (sortOption === "최신순") return "LATEST";
    if (sortOption === "인기순") return "POPULAR";
    if (sortOption === "높은가격순") return "PRICE_DESC";
    return "PRICE_ASC";
  }, [sortOption]);

  const tagsParam = useMemo(() => {
    if (appliedTags.size === 0) return undefined;
    // 메이크업 태그 코드들을 콤마로 이어서 서버로 전달
    return Array.from(appliedTags).join(",");
  }, [appliedTags]);

  // 현재 파라미터 스냅샷 (응답 검증 및 리셋 트리거)
  const paramsKey = useMemo(
    () =>
      JSON.stringify({
        region: getRegionQueryValue(selectedRegion) ?? null,
        sort: sortParam,
        tags: tagsParam ?? null,
      }),
    [selectedRegion, sortParam, tagsParam]
  );

  /* ========================= 필터/정렬/지역 변경 핸들러 ========================= */

  const handleRegionSelect = useCallback((key: RegionKey) => {
    setSelectedRegion(key);
    setItems([]);
    setHasMore(true);
    setTotalCount(0);
    setPageNumber(1);
  }, []);

  // 정렬 옵션 선택 시 정렬 시트 닫기
  const handleChangeSort = useCallback(
    (opt: SortOption) => {
      setSortOption(opt);
      setItems([]);
      setHasMore(true);
      setTotalCount(0);
      setPageNumber(1);
      closeSort();
    },
    [closeSort]
  );

  const toggleTag = useCallback((tag: MakeupTag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const resetFilter = useCallback(() => {
    setSelectedTags(new Set());
    setPreviewCount(null);
    setPreviewLoading(false);
  }, []);

  const applyFilter = useCallback(() => {
    // ✅ 선택된 태그가 없으면 "필터 없음" 상태로 적용 (전체 보기)
    if (selectedTags.size === 0) {
      setAppliedTags(new Set());
    } else {
      setAppliedTags(new Set(selectedTags));
    }

    // 목록 리셋 및 1페이지부터 다시
    setItems([]);
    setHasMore(true);
    setTotalCount(0);
    setPageNumber(1);
    closeFilter();
  }, [selectedTags, closeFilter]);

  const activeFilterCount = appliedTags.size;

  /* ========================= 페이지네이션 & 무한 스크롤 ========================= */

  const [pageNumber, setPageNumber] = useState(1); // 1-base
  const pageSize = 6;
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  // 진행 중 요청 취소를 위한 AbortController
  const controllerRef = useRef<AbortController | null>(null);
  // 현재 요청에 매긴 파라미터 키(응답 가드)
  const inFlightKeyRef = useRef<string | null>(null);
  // 중복 요청 방지 플래그
  const fetchingRef = useRef(false);
  // paramsKey 변경을 감지하기 위한 ref (이펙트 가드에 사용)
  const prevParamsKeyRef = useRef<string>(paramsKey);

  const fetchMoreItems = useCallback(
    async (page: number) => {
      if (fetchingRef.current || !hasMore) return;

      // 이전 요청 취소
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      // 현재 파라미터 스냅샷 고정
      const myKey = paramsKey;
      inFlightKeyRef.current = myKey;
      fetchingRef.current = true;

      const isInitial = page === 1;
      if (isInitial) setLoadingInitial(true);
      else setIsLoadingMore(true);

      setErrorMsg("");

      try {
        const regionValue = getRegionQueryValue(selectedRegion);

        const { data }: { data: PagedResponse } = await api.get(
          "/api/v1/makeup/filter",
          {
            params: {
              pageNumber: page,
              pageSize,
              region: regionValue,
              sortType: sortParam,
              tags: tagsParam, // 콤마 구분
            },
            signal: controller.signal,
          }
        );

        // 파라미터가 바뀐 뒤 늦게 온 응답이면 폐기
        if (inFlightKeyRef.current !== myKey || myKey !== paramsKey) {
          return;
        }

        const nextContent = data.content ?? [];
        setTotalCount(data.page.totalElements);

        setItems((prev) => {
          if (isInitial) {
            // 1페이지는 새로 세팅
            return nextContent;
          }
          // 2페이지 이상은 단순 이어붙이기 (중복 제거 X)
          return [...prev, ...nextContent];
        });

        const nextPage = page + 1;
        const more = nextPage <= data.page.totalPages;
        setHasMore(more);
      } catch (err: unknown) {
        // 의도적인 취소(axios 또는 AbortController)는 무시
        if (
          (axios.isAxiosError(err) && err.code === "ERR_CANCELED") ||
          (err instanceof Error && err.name === "CanceledError")
        ) {
          // 취소된 요청이므로 메시지 표시 안 함
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
    [hasMore, pageSize, selectedRegion, sortParam, tagsParam, paramsKey]
  );

  // paramsKey 변경 시 페이지 리셋 & fetch
  useEffect(() => {
    if (prevParamsKeyRef.current !== paramsKey && pageNumber !== 1) {
      prevParamsKeyRef.current = paramsKey;
      setPageNumber(1);
      return;
    }
    prevParamsKeyRef.current = paramsKey;
    fetchMoreItems(pageNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, pageNumber]);

  // 인터섹션 옵저버: 초기 로딩이 끝난 뒤에만 다음 페이지 요구
  useEffect(() => {
    const target = elementRef.current;
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
      { threshold: 0.1, rootMargin: "300px 0px" }
    );

    observer.observe(target);
    return () => observer.unobserve(target);
  }, [hasMore, loadingInitial, isLoadingMore]);

  /* ========================= 필터 미리보기 개수(fetch) ========================= */

  useEffect(() => {
    // 필터 시트가 닫히면 미리보기 상태 초기화 + 요청 취소
    if (!isFilterOpen) {
      previewControllerRef.current?.abort();
      setPreviewLoading(false);
      setPreviewCount(null);
      return;
    }

    // 아무 태그도 선택 안 했으면 미리보기 호출하지 않음
    if (selectedTags.size === 0) {
      previewControllerRef.current?.abort();
      setPreviewLoading(false);
      setPreviewCount(null);
      return;
    }

    const controller = new AbortController();
    previewControllerRef.current = controller;

    const fetchPreview = async () => {
      try {
        setPreviewLoading(true);

        const regionValue = getRegionQueryValue(selectedRegion);
        const tagsPreviewParam =
          selectedTags.size > 0
            ? Array.from(selectedTags).join(",")
            : undefined;

        const { data }: { data: PagedResponse } = await api.get(
          "/api/v1/makeup/filter",
          {
            params: {
              pageNumber: 1,
              pageSize: 1, // ✅ 개수만 알면 됨
              region: regionValue,
              sortType: sortParam,
              tags: tagsPreviewParam,
            },
            signal: controller.signal,
          }
        );

        setPreviewCount(data.page.totalElements);
      } catch (err: unknown) {
        if (
          (axios.isAxiosError(err) && err.code === "ERR_CANCELED") ||
          (err instanceof Error && err.name === "CanceledError")
        ) {
          // 취소 요청은 무시
        } else {
          console.error("메이크업 필터 미리보기 개수 조회 실패:", err);
          setPreviewCount(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setPreviewLoading(false);
        }
      }
    };

    void fetchPreview();

    return () => {
      controller.abort();
    };
  }, [isFilterOpen, selectedRegion, selectedTags, sortParam]);

  /* ========================= 렌더 ========================= */

  const hasSelectedTags = selectedTags.size > 0;

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
          메이크업
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

      {/* 지역 (상단 필터) */}
      <motion.div
        className="grid grid-cols-5 gap-4 px-5 mt-4 justify-items-center"
        variants={stagger(0.05)}
      >
        {regions.map((r) => {
          const isActive = selectedRegion === r.key;
          return (
            <motion.button
              key={r.key}
              type="button"
              onClick={() => handleRegionSelect(r.key as RegionKey)}
              className="flex flex-col items-center gap-3 isolate"
              variants={fadeUp}
            >
              <div
                className={`w-[60px] h-[60px] rounded-full border bg-white relative overflow-hidden grid place-items-center transition-all ${
                  isActive
                    ? "border-[#FF2233] shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                    : "border-[#F2F2F2]"
                }`}
              >
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
              <p
                className={`text-[14px] leading-[21px] tracking-[-0.2px] ${
                  isActive ? "text-[#FF2233] font-semibold" : "text-black"
                }`}
              >
                {r.label}
              </p>
            </motion.button>
          );
        })}
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

          <button
            className="flex items-center gap-1 active:scale-95"
            onClick={openSort}
          >
            <span className="text-[14px] text-[#000000]">{sortOption}</span>
            <Icon
              icon="solar:alt-arrow-down-linear"
              className="w-4 h-4 text-[#999999]"
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
            <motion.div
              className="fixed inset-0 z-40 bg-black/70"
              variants={dimVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={closeFilter}
            />
            <motion.div
              className="fixed left-1/2 bottom-0 z-50 w-full max-w-screen-sm -translate-x-1/2 bg-white rounded-t-[20px] shadow-[0_-8px_30px_rgba(0,0,0,0.18)]"
              variants={bottomSheetVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 + 본문 래퍼 (380px 고정, 본문만 스크롤) */}
              <div className="h-[380px] max-h-[380px] flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-6 flex-none">
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

                {/* 본문 (스크롤 영역) */}
                <div className="pt-5 px-5 pb-4 border-t border-[#F3F3F3] overflow-y-auto space-y-8 flex-1 scrollbar-hide">
                  {TAG_GROUPS.map((group, index) => {
                    const isLast = index === TAG_GROUPS.length - 1;
                    return (
                      <div
                        key={group.title}
                        className={`space-y-3 ${
                          !isLast ? "pb-5 border-b border-[#F3F3F3]" : ""
                        }`}
                      >
                        <p className="text-[16px] font-semibold text-[#1E2124]">
                          {group.title}
                        </p>
                        <div className="flex flex-wrap gap-2 my-4">
                          {group.items.map((tag) => {
                            const active = selectedTags.has(tag);
                            return (
                              <button
                                key={tag}
                                className={`h-[37px] px-3 rounded-full text-[14px] border transition-all
                              ${
                                active
                                  ? "bg-[#FFF2F2] border-[#FF4E5C] text-[#FF4E5C]"
                                  : "bg-white border-[#D9D9D9] text-[#999999]"
                              }
                            `}
                                onClick={() => toggleTag(tag)}
                              >
                                {TAG_LABEL[tag]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 하단 버튼 영역 */}
              <div className="flex items-center gap-3 px-5 py-4 border-t border-[#E8E8E8] bg-white">
                <button
                  className="flex-1 h-14 flex items-center justify-center gap-2 rounded-xl border border-[#E8E8E8] bg-white active:scale-95"
                  onClick={resetFilter}
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
                  onClick={applyFilter}
                >
                  <span className="text-[16px] font-semibold text-white">
                    {hasSelectedTags
                      ? previewLoading
                        ? "계산 중..."
                        : previewCount !== null
                        ? `${previewCount}개 결과 보기`
                        : "결과 보기"
                      : "결과 보기"}
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 정렬 Bottom Sheet */}
      <SortBottomSheet
        isOpen={isSortOpen}
        sortOption={sortOption}
        onClose={closeSort}
        onChange={handleChangeSort}
      />

      <SideMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </motion.div>
  );
};

export default MobileView;
