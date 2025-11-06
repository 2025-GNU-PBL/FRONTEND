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
    <div className="min-h-screen bg-gradient-to-b from-white to-rose-50/40">
      {/* 상단 히어로 */}
      <div className="bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 text-white">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <h1 className="text-3xl font-semibold tracking-tight">
            나의 찜 목록
          </h1>
          <p className="mt-2 text-white/90">
            {totalCount}개 항목이 저장되어 있어요
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-12 gap-8">
        {/* 필터 사이드바 */}
        <aside className="col-span-3">
          <div className="sticky top-20 space-y-6">
            <div className="rounded-2xl border border-rose-100 bg-white/70 backdrop-blur-md shadow-sm p-4">
              <label className="text-sm font-medium text-gray-700">검색</label>
              <div className="mt-2 relative">
                <Icon
                  icon="mdi:magnify"
                  className="absolute left-3 top-2.5 text-gray-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="제목 또는 설명"
                  className="w-full pl-9 pr-10 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-rose-200"
                />
                {query && (
                  <button
                    className="absolute right-2 top-1.5 p-2 rounded-lg hover:bg-gray-50"
                    onClick={() => setQuery("")}
                    aria-label="검색 지우기"
                  >
                    <Icon icon="mdi:close" />
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-white/70 backdrop-blur-md shadow-sm p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                카테고리
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const active = c.key === category;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                        active
                          ? "bg-rose-500 text-white border-rose-500 shadow"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Icon icon={c.icon} className="text-base" />
                      <span className="text-sm">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-white/70 backdrop-blur-md shadow-sm p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">정렬</div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Props["sort"])}
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-rose-200"
              >
                <option value="recent">최신순</option>
                <option value="priceAsc">가격 낮은순</option>
                <option value="priceDesc">가격 높은순</option>
              </select>

              <button
                onClick={onClear}
                className="mt-4 w-full px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-95 transition flex items-center justify-center gap-1"
                title="전체 비우기"
              >
                <Icon icon="mdi:trash-can-outline" />
                전체 비우기
              </button>
            </div>
          </div>
        </aside>

        {/* 카드 그리드 */}
        <main className="col-span-9">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-24 border rounded-3xl bg-white/60 backdrop-blur-md">
              <div className="mx-auto w-28 h-28 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center shadow-inner">
                <Icon
                  icon="mdi:heart-outline"
                  className="text-5xl text-rose-400"
                />
              </div>
              <p className="mt-5 text-lg font-semibold">
                아직 찜한 항목이 없어요
              </p>
              <p className="text-sm text-gray-400">
                마음에 드는 항목을 추가해보세요.
              </p>
            </div>
          ) : (
            <div className="grid xl:grid-cols-3 lg:grid-cols-2 sm:grid-cols-2 grid-cols-1 gap-6">
              {items.map((it) => (
                <article
                  key={it.id}
                  className="group rounded-3xl border border-rose-100 bg-white/80 backdrop-blur-md shadow-sm hover:shadow-xl transition overflow-hidden hover:-translate-y-0.5"
                >
                  <div className="relative">
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50">
                      {it.imageUrl ? (
                        <img
                          src={it.imageUrl}
                          alt={it.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Icon
                            icon="mdi:image-off-outline"
                            className="text-4xl"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onRemove(it.id)}
                      className="absolute right-4 top-4 p-2.5 rounded-full bg-white/95 border border-rose-100 text-rose-500 hover:bg-rose-50 active:scale-95 transition shadow"
                      title="찜 해제"
                      aria-label="찜 해제"
                    >
                      <Icon icon="mdi:heart-off-outline" className="text-xl" />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      {it.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                          {it.category}
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-800 truncate">
                        {it.title}
                      </h3>
                    </div>

                    {it.subtitle && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {it.subtitle}
                      </p>
                    )}

                    {typeof it.price === "number" && (
                      <div className="mt-3 flex items-center justify-between">
                        <p className="font-semibold text-gray-900">
                          {it.price.toLocaleString()}원
                        </p>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Icon icon="mdi:clock-outline" />
                          <span>저장됨</span>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default WebView;
