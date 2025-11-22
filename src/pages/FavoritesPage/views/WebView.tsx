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

const WebView = ({
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
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F7F5FF] to-[#FFF7FB] text-[14px] text-black/80">
      {/* 상단 히어로 영역 */}
      <header className="bg-gradient-to-r from-[#7B61D1] via-[#A26DFF] to-[#FF7DA8] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-8 py-9 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-semibold tracking-tight">
              <Icon
                icon="solar:heart-bold-duotone"
                className="mr-3 h-7 w-7 text-[#FFE9F4]"
              />
              나의 찜 목록
            </h1>
            <p className="mt-2 text-sm text-white/85">
              마음에 드는 웨딩홀 · 스튜디오 · 드레스를 모아두고 한 번에 비교해
              보세요.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-xs text-white/90 backdrop-blur-sm">
              <Icon icon="solar:bookmark-bold" className="h-4 w-4" />
              <span>
                현재{" "}
                <strong className="font-semibold">
                  {totalCount.toLocaleString()}개
                </strong>{" "}
                항목이 저장되어 있어요
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 text-sm md:items-end">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
              <Icon
                icon="solar:stars-minimalistic-bold-duotone"
                className="mr-1.5 h-4 w-4 text-yellow-300"
              />
              2030 신부님들의 PICK
            </span>
            <p className="text-xs text-white/75">
              계정이 동일하다면, 다른 기기에서도 동일한 찜 목록을 볼 수 있어요.
            </p>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-7xl px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* 필터 사이드바 */}
          <aside className="col-span-12 space-y-5 lg:col-span-3">
            {/* 검색 카드 */}
            <section className="rounded-2xl border border-[#E4E0FF] bg-white/90 p-4 shadow-sm backdrop-blur">
              <h2 className="text-sm font-semibold text-black/80">검색</h2>
              <p className="mt-1 text-xs text-black/45">
                찜한 항목이 많다면 제목이나 설명으로 빠르게 찾아보세요.
              </p>
              <div className="mt-3 relative">
                <Icon
                  icon="tabler:search"
                  className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="제목 · 설명으로 검색"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-9 pr-10 py-2 text-[13px] outline-none transition focus:border-[#7B61D1] focus:bg-white focus:ring-2 focus:ring-[#E0D7FF]"
                />
                {query && (
                  <button
                    className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full p-1.5 text-gray-500 hover:bg-gray-100 active:scale-95"
                    onClick={() => setQuery("")}
                    aria-label="검색 지우기"
                  >
                    <Icon icon="mdi:close" className="h-4 w-4" />
                  </button>
                )}
              </div>
            </section>

            {/* 카테고리 카드 */}
            <section className="rounded-2xl border border-[#E4E0FF] bg-white/95 p-4 shadow-sm backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-black/80">
                  카테고리
                </h2>
                <span className="text-[11px] text-black/40">
                  원하는 유형만 모아서 보기
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const active = c.key === category;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={[
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-all duration-200",
                        active
                          ? "bg-[#7B61D1] text-white shadow-md ring-1 ring-[#6F55C4]"
                          : "border border-[#E4E0FF] bg-[#F7F5FF] text-[#5C4AA8] hover:bg-[#F1EDFF]",
                      ].join(" ")}
                    >
                      <Icon icon={c.icon} className="h-4 w-4" />
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 정렬 / 전체삭제 카드 */}
            <section className="rounded-2xl border border-[#E4E0FF] bg-white/95 p-4 shadow-sm backdrop-blur">
              <h2 className="text-sm font-semibold text-black/80">
                정렬 / 관리
              </h2>
              <div className="mt-2 space-y-3">
                <div>
                  <label className="text-xs font-medium text-black/60">
                    정렬 기준
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Props["sort"])}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2 text-[13px] outline-none transition focus:border-[#7B61D1] focus:bg-white focus:ring-2 focus:ring-[#E0D7FF]"
                  >
                    <option value="recent">최근에 추가된 순</option>
                    <option value="priceAsc">가격 낮은순</option>
                    <option value="priceDesc">가격 높은순</option>
                  </select>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-[#EAE4FF] to-transparent" />

                <button
                  onClick={onClear}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#FFD5D5] bg-[#FFF2F2] px-3 py-2 text-[13px] font-semibold text-[#DF3B3B] shadow-[0_1px_6px_rgba(222,59,59,0.08)] transition hover:bg-[#FFE5E5] active:scale-95"
                  title="전체 비우기"
                >
                  <Icon icon="mdi:trash-can-outline" className="h-4.5 w-4.5" />
                  <span>전체 비우기</span>
                </button>

                <p className="text-[11px] text-black/40">
                  한 번에 비우기 전에 필요한 항목은 따로 메모해 두는 걸
                  추천드려요.
                </p>
              </div>
            </section>
          </aside>

          {/* 카드 그리드 */}
          <section className="col-span-12 lg:col-span-9">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-[#E0D7FF] bg-white/70 py-20 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#F0EBFF] via-[#FFE4F2] to-[#FFF4E5] shadow-inner">
                  <Icon
                    icon="solar:heart-linear"
                    className="h-10 w-10 text-[#7B61D1]"
                  />
                </div>
                <p className="mt-5 text-lg font-semibold text-black/75">
                  아직 찜해 둔 항목이 없어요
                </p>
                <p className="mt-2 text-sm text-black/45">
                  검색 결과나 상세 페이지에서{" "}
                  <span className="font-medium text-[#7B61D1]">
                    하트 아이콘
                  </span>
                  을 눌러 마음에 드는 상품을 저장해 보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 상단 요약 / 뱃지 */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-black/50">
                    <span className="inline-flex items-center rounded-full bg-[#F7F5FF] px-3 py-1 text-[12px] font-medium text-[#5C4AA8]">
                      <Icon
                        icon="solar:sort-from-bottom-to-top-bold-duotone"
                        className="mr-1.5 h-4 w-4"
                      />
                      정렬 기준:{" "}
                      {
                        {
                          recent: "최근에 추가된 순",
                          priceAsc: "가격 낮은순",
                          priceDesc: "가격 높은순",
                        }[sort]
                      }
                    </span>
                    {category !== "all" && (
                      <span className="inline-flex items-center rounded-full bg-[#FFF7E5] px-3 py-1 text-[12px] font-medium text-[#D68A1C]">
                        <Icon
                          icon="solar:filter-bold-duotone"
                          className="mr-1.5 h-4 w-4"
                        />
                        {categories.find((c) => c.key === category)?.label}
                        {"만 보기"}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-black/40">
                    총{" "}
                    <span className="font-semibold text-[#7B61D1]">
                      {items.length.toLocaleString()}
                    </span>{" "}
                    개 항목이 현재 조건에 맞아요.
                  </p>
                </div>

                {/* 카드 그리드 */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((it) => (
                    <article
                      key={it.id}
                      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#E6E1FF] bg-white/95 shadow-[0_4px_20px_rgba(123,97,209,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(123,97,209,0.16)]"
                    >
                      {/* 이미지 영역 */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F4F8]">
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
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

                        {/* 상단 그라데이션 */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        {/* 카테고리 태그 */}
                        {it.category && (
                          <div className="absolute left-3 top-3">
                            <span className="inline-flex items-center rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
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

                        {/* 우상단 액션 버튼 */}
                        <div className="absolute right-3 top-3 flex gap-1.5">
                          <button
                            onClick={() => onRemove(it.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#DF3B3B] shadow-sm backdrop-blur-sm transition hover:bg-[#FFF1F1] active:scale-95"
                            title="찜 해제"
                            aria-label="찜 해제"
                          >
                            <Icon
                              icon="mdi:heart-off-outline"
                              className="h-4.5 w-4.5"
                            />
                          </button>
                        </div>
                      </div>

                      {/* 텍스트 영역 */}
                      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 flex-1 text-[15px] font-semibold text-black/85">
                            {it.title}
                          </h3>
                          {typeof it.price === "number" && (
                            <span className="ml-1 shrink-0 rounded-full bg-[#FFF1F1] px-2.5 py-1 text-[12px] font-bold text-[#DF3B3B] shadow-sm">
                              {it.price.toLocaleString()}원
                            </span>
                          )}
                        </div>

                        {it.subtitle && (
                          <p className="mt-1 line-clamp-2 text-[13px] text-black/50">
                            {it.subtitle}
                          </p>
                        )}

                        <div className="mt-3 flex items-center justify-between text-[11px] text-black/45">
                          <span className="inline-flex items-center gap-1">
                            <Icon
                              icon="solar:clock-linear"
                              className="h-3.5 w-3.5"
                            />
                            <span>최근에 추가된 항목</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Icon
                              icon="solar:bookmark-linear"
                              className="h-3.5 w-3.5"
                            />
                            <span>찜 보관함</span>
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default WebView;
