// /sections/ResultsWeb.tsx
import { Icon } from "@iconify/react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { koreanFuzzyMatch } from "../../../utils/koreanSearch";

type ResultsProps = {
  /** 부모에서 넘기면 이 값을 우선 사용, 안 넘기면 URL ?q= 사용 */
  query?: string;
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

const RAW_ITEMS: Card[] = [
  {
    id: "A",
    img: "/images/placeholder.png",
    brand: "루이즈블랑",
    title: "[촬영] 드레스 3벌",
    price: "300,000원",
    views: "1,234명이 봤어요",
    badges: [
      { label: "BEST", bg: "#EFEBFF", color: "#803BFF" },
      { label: "신상", bg: "#FDECFF", color: "#FF2D9E" },
    ],
    heart: true,
  },
  {
    id: "B",
    img: "/images/placeholder.png",
    brand: "루이즈블랑",
    title: "[본식] 드레스 2벌",
    price: "480,000원",
    views: "2,001명이 봤어요",
    badges: [{ label: "BEST", bg: "#EFEBFF", color: "#803BFF" }],
    heart: true,
  },
  {
    id: "C",
    img: "/images/placeholder.png",
    brand: "포토바이유",
    title: "스튜디오 2시간 대관",
    price: "150,000원",
    views: "856명이 봤어요",
    heart: true,
  },
  {
    id: "D",
    img: "/images/placeholder.png",
    brand: "메이크랩",
    title: "메이크업 신부 베이직",
    price: "220,000원",
    views: "1,102명이 봤어요",
    heart: true,
  },
  // 데스크톱 샘플용으로 약간 더 추가
  {
    id: "E",
    img: "/images/placeholder.png",
    brand: "라비앙로즈",
    title: "본식 헤어/메이크업 패키지",
    price: "350,000원",
    views: "934명이 봤어요",
    badges: [{ label: "BEST", bg: "#EFEBFF", color: "#803BFF" }],
  },
  {
    id: "F",
    img: "/images/placeholder.png",
    brand: "더화이트홀",
    title: "웨딩홀 스탠다드 패키지",
    price: "2,900,000원",
    views: "2,410명이 봤어요",
  },
];

export default function ResultsWeb({ query }: ResultsProps) {
  const [sp] = useSearchParams();
  const qFromUrl = sp.get("q")?.trim() ?? "";
  const q = (query ?? qFromUrl).trim(); // ✅ props 우선, 없으면 URL

  // 더미데이터 필터(초성/부분 허용). UI엔 영향 없음.
  const items = useMemo(() => {
    if (!q) return RAW_ITEMS;
    return RAW_ITEMS.filter(
      (it) => koreanFuzzyMatch(q, it.title) || koreanFuzzyMatch(q, it.brand)
    );
  }, [q]);

  return (
    <div className="relative">
      {/* 상단 결과 요약 + 정렬 더미 */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-[14px] text-gray-700">전체 {items.length}개</div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-[#F3F4F5] text-xs text-gray-700 hover:bg-black/10">
            <Icon icon="tabler:sort-descending" className="w-4 h-4" />
            인기순
          </button>
          <button className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-[#F3F4F5] text-xs text-gray-700 hover:bg-black/10">
            <Icon icon="tabler:currency-won" className="w-4 h-4" />
            가격낮은순
          </button>
          <button className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-[#F3F4F5] text-xs text-gray-700 hover:bg-black/10">
            <Icon icon="tabler:currency-won" className="w-4 h-4 rotate-180" />
            가격높은순
          </button>
        </div>
      </div>

      {/* 카드 그리드 (데스크톱 3~4열) */}
      <div className="grid gap-6 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {items.map((it) => {
          const hasBadges = !!it.badges?.length;
          return (
            <div
              key={it.id}
              className="group flex flex-col rounded-xl border border-black/5 overflow-hidden hover:shadow-sm transition-shadow bg-white"
            >
              {/* 썸네일 */}
              <div className="relative w-full aspect-[4/3] bg-[#F3F4F5] overflow-hidden">
                <img
                  src={it.img}
                  alt={`${it.brand} - ${it.title}`}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
                {it.heart && (
                  <button
                    aria-label="wish"
                    className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/50"
                  >
                    <Icon icon="solar:heart-linear" className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 텍스트 묶음 */}
              <div className="p-4 flex flex-col gap-2">
                <div className="text-[13px] text-gray-500">{it.brand}</div>
                <div className="text-[15px] text-black line-clamp-2 min-h-[44px]">
                  {it.title}
                </div>

                {hasBadges && (
                  <div className="flex items-center gap-1 pt-1">
                    {it.badges!.map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[12px] font-semibold"
                        style={{ background: b.bg, color: b.color }}
                      >
                        {b.label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-1 text-[18px] font-semibold text-black">
                  {it.price}
                </div>
                <div className="text-[12px] text-gray-500">{it.views}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 검색어 없을 때 가이드 */}
      {!q && (
        <div className="mt-10 rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
          원하는 키워드를 입력하거나 좌측 필터를 사용해 보세요.
        </div>
      )}
    </div>
  );
}
