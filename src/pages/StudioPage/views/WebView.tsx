import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { Product } from "../../../type/product";
import api from "../../../lib/api/axios";
// ✅ 프로젝트 api 인스턴스 경로에 맞게 조정

/* ========================= 애니메이션 유틸 ========================= */

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
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

/* ========================= 카드 ========================= */

type CardProps = {
  product: Product;
  liked: boolean;
  onToggleLike: (id: number) => void;
};

const Card: React.FC<CardProps> = ({ product, liked, onToggleLike }) => {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -2 }}
      className="group relative w-full overflow-hidden rounded-2xl border border-[#F1F1F1] bg-white"
    >
      {/* 이미지 영역 */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <img
          src={getThumb(product)}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* 찜 버튼(로컬 전용) */}
        <button
          type="button"
          aria-label={liked ? "찜 해제" : "찜하기"}
          aria-pressed={liked}
          onClick={(e) => {
            e.preventDefault();
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

      {/* 텍스트 영역 */}
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6B7280]">{product.ownerName}</p>
          <div className="flex items-center gap-1">
            <img src="/images/star2.png" alt="평점" className="mb-[2px] h-3" />
            <span className="text-xs text-[#374151]">
              {Number(product.starCount || 0).toFixed(1)}
            </span>
          </div>
        </div>

        <h3 className="line-clamp-2 text-base font-medium text-[#111827]">
          {product.name}
        </h3>

        <div className="mt-1 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-[#111827]">
            {formatPrice(product.price)}
          </p>

          {/* 간단 태그 (최대 2개만 표시) */}
          <div className="flex max-w-[60%] flex-wrap items-center gap-1">
            {(product.tags || []).slice(0, 2).map((t) => (
              <span
                key={t.id}
                className="truncate rounded-full border border-[#E5E7EB] px-2 py-0.5 text-[11px] text-[#4B5563]"
                title={t.tagName}
              >
                {t.tagName}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
};

/* ========================= 웹 뷰 ========================= */

const WebView: React.FC = () => {
  // 서버 데이터
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 로컬 상태
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [keyword, setKeyword] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("전체");
  const [sortKey, setSortKey] = useState<
    "recent" | "priceAsc" | "priceDesc" | "ratingDesc"
  >("recent");

  const toggleLike = useCallback((id: number) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 데이터 패치
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const response = await api.get(`/api/v1/studio`);
        const data: Product[] = Array.isArray(response?.data)
          ? response.data
          : response?.data?.content ?? response?.data ?? [];
        if (!mounted) return;
        setItems(data);
      } catch (err: any) {
        if (!mounted) return;
        setErrorMsg(
          err?.response?.data?.message ||
            err?.message ||
            "웨딩홀 목록을 불러오지 못했습니다."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 필터 & 정렬
  const filtered = useMemo(() => {
    let list = items;

    if (selectedRegion !== "전체") {
      list = list.filter((p) => p.region === selectedRegion);
    }

    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.ownerName.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }

    switch (sortKey) {
      case "priceAsc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "ratingDesc":
        list = [...list].sort(
          (a, b) => (b.starCount || 0) - (a.starCount || 0)
        );
        break;
      case "recent":
      default:
        list = [...list].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    return list;
  }, [items, keyword, selectedRegion, sortKey]);

  const totalCount = filtered.length;

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl px-8 pb-16 pt-10 mt-15"
      variants={stagger()}
      initial="hidden"
      animate="show"
    >
      {/* 본문: 좌측 필터 / 우측 리스트 */}
      <div className="grid grid-cols-12 gap-8">
        {/* 사이드 필터 */}
        <motion.aside
          variants={fadeUp}
          className="col-span-12 rounded-2xl border border-[#F1F1F1] bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:col-span-3"
        >
          {/* 지역 필터 */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-[#111827]">지역</h2>
            <div className="flex flex-wrap gap-2">
              {regions.map((r) => {
                const active = selectedRegion === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setSelectedRegion(r.key)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-[#111827] bg-[#111827] text-white"
                        : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]"
                    }`}
                  >
                    {r.image && (
                      <img
                        src={r.image}
                        alt={r.label}
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    )}
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="my-6 h-px w-full bg-[#F3F4F6]" />

          {/* 정렬 */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-[#111827]">정렬</h2>
            <div className="grid gap-2">
              {[
                { key: "recent", label: "최신 등록순" },
                { key: "ratingDesc", label: "평점 높은순" },
                { key: "priceAsc", label: "가격 낮은순" },
                { key: "priceDesc", label: "가격 높은순" },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="flex cursor-pointer items-center gap-2 text-sm text-[#374151]"
                >
                  <input
                    type="radio"
                    name="sort"
                    value={opt.key}
                    checked={sortKey === opt.key}
                    onChange={() =>
                      setSortKey(
                        opt.key as
                          | "recent"
                          | "priceAsc"
                          | "priceDesc"
                          | "ratingDesc"
                      )
                    }
                    className="h-4 w-4 accent-black"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="my-6 h-px w-full bg-[#F3F4F6]" />

          {/* 초기화 */}
          <button
            type="button"
            onClick={() => {
              setSelectedRegion("전체");
              setSortKey("recent");
              setKeyword("");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white py-2.5 text-sm text-[#374151] transition hover:border-[#D1D5DB]"
          >
            <Icon icon="mdi:reload" className="h-4 w-4" />
            필터 초기화
          </button>
        </motion.aside>

        {/* 리스트 영역 */}
        <div className="col-span-12 lg:col-span-9">
          {/* 상태 */}
          {loading && (
            <motion.div
              variants={fadeUp}
              className="rounded-xl border border-[#F3F4F6] bg-white p-6"
            >
              <p className="text-sm text-[#6B7280]">불러오는 중…</p>
            </motion.div>
          )}
          {!!errorMsg && !loading && (
            <motion.div
              variants={fadeUp}
              className="rounded-xl border border-red-100 bg-red-50 p-6"
            >
              <p className="text-sm text-red-600">{errorMsg}</p>
            </motion.div>
          )}

          {!loading && !errorMsg && (
            <>
              {/* 상단 툴바 */}
              <motion.div
                variants={fadeUp}
                className="mb-4 flex items-center justify-between"
              >
                <span className="text-sm text-[#6B7280]">
                  {selectedRegion === "전체" ? "전체 지역" : selectedRegion} ·{" "}
                  <strong className="text-[#111827]">{totalCount}</strong>개
                  결과
                </span>

                {/* 보조 정렬 셀렉트(사이드 라디오와 동기) */}
                <div className="flex items-center gap-2">
                  <Icon
                    icon="solar:sort-linear"
                    className="h-5 w-5 text-[#6B7280]"
                  />
                  <select
                    value={sortKey}
                    onChange={(e) =>
                      setSortKey(
                        e.target.value as
                          | "recent"
                          | "priceAsc"
                          | "priceDesc"
                          | "ratingDesc"
                      )
                    }
                    className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm text-[#111827] focus:outline-none"
                  >
                    <option value="recent">최신 등록순</option>
                    <option value="ratingDesc">평점 높은순</option>
                    <option value="priceAsc">가격 낮은순</option>
                    <option value="priceDesc">가격 높은순</option>
                  </select>
                </div>
              </motion.div>

              {/* 카드 그리드 */}
              <motion.div
                variants={stagger(0.02)}
                className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4"
              >
                {filtered.map((p) => (
                  <Card
                    key={p.id}
                    product={p}
                    liked={likedIds.has(p.id)}
                    onToggleLike={toggleLike}
                  />
                ))}
              </motion.div>

              {/* 결과 없음 */}
              {filtered.length === 0 && (
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
