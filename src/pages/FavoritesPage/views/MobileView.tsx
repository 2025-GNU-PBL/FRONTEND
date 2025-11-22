import { Icon } from "@iconify/react";
import type { FavoriteItem } from "../FavoritesPage";

type Props = {
  items: FavoriteItem[];
  totalCount: number;
  query: string;
  setQuery: (v: string) => void;
  category: FavoriteItem["category"] | "all";
  setCategory: (v: Props["category"]) => void;
  sort: "recent" | "priceAsc" | "priceDesc";
  setSort: (v: Props["sort"]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

const categories: { key: Props["category"]; label: string; icon: string }[] = [
  { key: "all", label: "전체", icon: "mdi:apps" },
  { key: "studio", label: "스튜디오", icon: "mdi:camera-outline" },
  { key: "dress", label: "드레스", icon: "mdi:hanger" },
  { key: "makeup", label: "메이크업", icon: "mdi:brush" },
  { key: "etc", label: "기타", icon: "mdi:dots-horizontal" },
];

const MobileView = ({
  items,
  totalCount,
  query,
  setQuery,
  category,
  setCategory,
  sort,
  setSort,
  onRemove,
  onClear,
}: Props) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F2FF] via-[#F9F5FF] to-[#FFF7FB] text-[13px] text-black/80 mb-15">
      {/* 상단 헤더 영역 */}
      <section className="sticky top-0 z-10 bg-gradient-to-r from-[#7B61D1] via-[#A26DFF] to-[#FF7DA8] text-white shadow-md">
        <div className="px-4 pt-7 pb-5 rounded-b-3xl bg-gradient-to-b from-black/5 to-transparent">
          {/* 타이틀 + 카운트 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight">
                나의 찜 목록
              </h1>
              <p className="mt-1 text-xs text-white/80">
                총{" "}
                <span className="font-semibold text-white">
                  {totalCount.toLocaleString()}
                </span>
                개의 항목이 저장되어 있어요
              </p>
            </div>

            <div className="flex flex-col items-end text-xs text-white/80">
              <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                <Icon
                  icon="solar:heart-bold-duotone"
                  className="mr-1.5 h-3.5 w-3.5"
                />
                웨딩 PICK
              </span>
            </div>
          </div>

          {/* 검색 입력 */}
          <div className="mt-4">
            <div className="relative">
              <Icon
                icon="tabler:search"
                className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/80"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="원하는 스튜디오 · 드레스 등을 검색해보세요"
                className="w-full rounded-2xl border border-white/30 bg-white/15 px-9 pr-10 py-2.5 text-[13px] placeholder:text-white/70 outline-none backdrop-blur-md focus:border-white focus:ring-2 focus:ring-white/60"
              />
              {query && (
                <button
                  className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full p-1.5 text-white/80 hover:bg-white/10 active:scale-95"
                  onClick={() => setQuery("")}
                  aria-label="검색 지우기"
                >
                  <Icon icon="mdi:close" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 카테고리 칩 */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((c) => {
              const active = c.key === category;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={[
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-all duration-200 whitespace-nowrap backdrop-blur-md",
                    active
                      ? "bg-white text-[#7B61D1] border-white shadow-md"
                      : "bg-white/5 border-white/30 text-white hover:bg-white/15",
                  ].join(" ")}
                >
                  <Icon icon={c.icon} className="h-3.5 w-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* 정렬 / 전체삭제 */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 rounded-2xl bg-white/10 p-[2px]">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Props["sort"])}
                className="w-full rounded-[14px] border border-white/25 bg-white/20 px-3 py-2 text-[12px] font-medium text-white outline-none backdrop-blur-md focus:border-white focus:ring-2 focus:ring-white/60"
              >
                <option value="recent">최근에 추가된 순</option>
                <option value="priceAsc">가격 낮은순</option>
                <option value="priceDesc">가격 높은순</option>
              </select>
            </div>
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 rounded-2xl border border-white/80 bg-white/95 px-3.5 py-2 text-[12px] font-semibold text-[#DF3B3B] shadow-sm hover:bg-white active:scale-95"
              title="전체 비우기"
            >
              <Icon icon="mdi:trash-can-outline" className="h-4 w-4" />
              <span>전체 비우기</span>
            </button>
          </div>
        </div>
      </section>

      {/* 리스트 영역 */}
      <section className="px-4 py-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 pb-20 text-center text-gray-500">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#F0EBFF] via-[#FFE4F2] to-[#FFF4E5] shadow-inner">
              <Icon
                icon="solar:heart-linear"
                className="h-10 w-10 text-[#7B61D1]"
              />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-black/70">
              아직 찜한 항목이 없어요
            </p>
            <p className="mt-1 text-[12px] text-black/40">
              마음에 드는 웨딩홀 · 스튜디오 · 드레스를 찜해두면
              <br />한 번에 비교하기 훨씬 쉬워져요.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4">
            {items.map((it) => (
              <li
                key={it.id}
                className="group overflow-hidden rounded-2xl border border-[#ECE7FF] bg-white/95 shadow-[0_6px_20px_rgba(123,97,209,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(123,97,209,0.16)]"
              >
                <div className="relative">
                  {/* 이미지 */}
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#F4F4F8]">
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#B0B0B0]">
                        <Icon
                          icon="mdi:image-off-outline"
                          className="h-8 w-8"
                        />
                      </div>
                    )}
                  </div>

                  {/* 상단 그라데이션 */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* 우상단 찜 해제 버튼 */}
                  <button
                    onClick={() => onRemove(it.id)}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#DF3B3B] shadow-sm backdrop-blur-md hover:bg-[#FFF1F1] active:scale-95"
                    title="찜 해제"
                    aria-label="찜 해제"
                  >
                    <Icon
                      icon="mdi:heart-off-outline"
                      className="h-4.5 w-4.5"
                    />
                  </button>

                  {/* 좌상단 카테고리 뱃지 */}
                  {it.category && (
                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                        <Icon
                          icon={
                            categories.find((c) => c.key === it.category)
                              ?.icon ?? "mdi:tag-outline"
                          }
                          className="mr-1 h-3.5 w-3.5"
                        />
                        {it.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* 텍스트 영역 */}
                <div className="space-y-1.5 px-3.5 pb-3.5 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 flex-1 text-[14px] font-semibold text-black/85">
                      {it.title}
                    </h3>
                    {typeof it.price === "number" && (
                      <span className="ml-1 shrink-0 rounded-full bg-[#FFF1F1] px-2.5 py-1 text-[12px] font-bold text-[#DF3B3B] shadow-sm">
                        {it.price.toLocaleString()}원
                      </span>
                    )}
                  </div>

                  {it.subtitle && (
                    <p className="line-clamp-2 text-[12px] text-black/50">
                      {it.subtitle}
                    </p>
                  )}

                  {/* 하단 메타 (필요하면 추후 확장) */}
                  <div className="mt-1 flex items-center justify-between text-[11px] text-black/40">
                    <span className="inline-flex items-center gap-1">
                      <Icon icon="solar:clock-linear" className="h-3.5 w-3.5" />
                      <span>최근에 찜한 항목이에요</span>
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MobileView;
