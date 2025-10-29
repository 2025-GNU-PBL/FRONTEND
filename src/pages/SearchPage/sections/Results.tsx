// sections/Results.tsx
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
      { label: "BEST", bg: "#FDECFF", color: "#FF2D9E" },
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
];

export default function Results({ query }: ResultsProps) {
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
    <div className="relative w-[390px] min-h-screen">
      <div className="pt-[80px] px-[20px]">
        <div className="w-[200px] h-[21px] text-[14px] leading-[150%] tracking-[-0.2px] text-black">
          전체 {items.length}개
        </div>
      </div>

      {/* 카드 그리드 (겹침 방지) */}
      <div className="mt-8 px-[20px] grid grid-cols-2 gap-x-[10px] gap-y-8">
        {items.map((it) => {
          const hasBadges = !!it.badges?.length;
          return (
            <div
              key={it.id}
              className="flex flex-col items-start isolate w-[170px] gap-3"
            >
              {/* 썸네일 */}
              <div className="relative w-[170px] h-[176px] overflow-hidden rounded-[8px] bg-[#F3F4F5]">
                <img
                  src={it.img}
                  alt="thumb"
                  className="w-full h-full object-cover"
                />
                {it.heart && (
                  <button
                    aria-label="wish"
                    className="absolute right-2 top-2 w-4 h-4 flex items-center justify-center"
                  >
                    <Icon
                      icon="solar:heart-linear"
                      className="w-4 h-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                    />
                  </button>
                )}
              </div>

              {/* 텍스트 묶음 */}
              <div
                className={`flex flex-col items-start w-[170px] ${
                  hasBadges ? "h-[98px]" : "h-[72px]"
                } gap-1`}
              >
                <div className="flex flex-col items-start w-[170px] h-[42px]">
                  <div className="w-[170px] h-[21px] text-[14px] leading-[150%] tracking-[-0.2px] text-[#999999]">
                    {it.brand}
                  </div>
                  <div className="w-[170px] h-[21px] text-[14px] leading-[150%] tracking-[-0.2px] text-black">
                    {it.title}
                  </div>
                </div>

                {hasBadges && (
                  <div
                    className={`flex flex-row items-start gap-1 ${
                      it.badges!.length > 1 ? "w-[96px]" : "w-[46px]"
                    } h-[22px]`}
                  >
                    {it.badges!.map((b, i) => (
                      <div
                        key={i}
                        className="flex flex-row items-center px-2 py-[2px] w-[46px] h-[22px] rounded-[4px]"
                        style={{ background: b.bg }}
                      >
                        <span
                          className="text-[12px] font-semibold leading-[150%] tracking-[-0.2px]"
                          style={{ color: b.color }}
                        >
                          {b.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="w-[170px] h-[26px] text-[16px] font-semibold leading-[160%] tracking-[-0.2px] text-black">
                  {it.price}
                </div>
              </div>

              <div className="w-[170px] h-[18px] text-[12px] leading-[150%] tracking-[-0.1px] text-[#999999]">
                {it.views}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
