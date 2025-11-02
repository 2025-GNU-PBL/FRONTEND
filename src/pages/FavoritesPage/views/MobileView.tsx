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
    // 배경을 깔끔한 단색으로 변경
    <div className="min-h-screen bg-gray-50">
      {/* 헤더: 전체적인 높이(패딩) 축소 */}
      <section className="px-4 pt-6 pb-4 bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400 text-white rounded-b-3xl shadow-lg sticky top-0 z-10">
        {/* 타이틀 크기 축소 */}
        <h1 className="text-2xl font-bold">찜 목록</h1>
        <p className="mt-1.5 text-white/90 text-sm">{totalCount}개 저장됨</p>

        {/* 검색: 높이(py) 축소 */}
        <div className="mt-4 relative">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-2.5 text-white/70"
            fontSize={18}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="원하는 항목을 검색하세요"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/30 backdrop-blur-md placeholder-white/80 border border-white/30 outline-none focus:ring-2 focus:ring-white transition-all"
          />
          {query && (
            <button
              className="absolute right-2 top-1.5 p-2 rounded-xl hover:bg-white/20"
              onClick={() => setQuery("")}
              aria-label="검색 지우기"
            >
              <Icon icon="mdi:close" fontSize={18} />
            </button>
          )}
        </div>

        {/* 카테고리 칩: 높이(py) 및 간격(mt) 축소 */}
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => {
            const active = c.key === category;
            return (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-200 ${
                  active
                    ? "bg-white text-rose-500 border-white shadow-md font-semibold"
                    : "bg-white/10 text-white border-white/40 hover:bg-white/20"
                }`}
              >
                <Icon icon={c.icon} className="text-sm" />
                <span className="text-sm">{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* 정렬 & 비우기: 높이(py) 및 간격(mt) 축소 */}
        <div className="mt-3 flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Props["sort"])}
            className="flex-1 rounded-lg bg-white/20 text-white px-3 py-2 border border-white/40 outline-none font-medium text-sm"
          >
            <option value="recent">최신순</option>
            <option value="priceAsc">가격 낮은순</option>
            <option value="priceDesc">가격 높은순</option>
          </select>
          <button
            onClick={onClear}
            className="px-3 py-2 rounded-lg bg-white text-rose-500 border border-white hover:bg-rose-50 active:scale-95 transition font-semibold"
            title="전체 비우기"
          >
            <div className="flex items-center gap-1.5">
              <Icon icon="mdi:trash-can-outline" fontSize={16} />
              <span className="text-sm">비우기</span>
            </div>
          </button>
        </div>
      </section>

      {/* 리스트: 전체적인 패딩(px, py) 축소 */}
      <section className="px-4 py-5">
        {items.length === 0 ? (
          // 빈 화면 UI: 크기 및 패딩 축소
          <div className="text-center text-gray-500 pt-16 pb-20">
            <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
              <Icon
                icon="mdi:heart-outline"
                className="text-4xl text-pink-500"
              />
            </div>
            <p className="mt-4 text-base font-semibold">
              아직 찜한 항목이 없어요
            </p>
            <p className="mt-1 text-sm text-gray-400">
              마음에 드는 항목에 하트를 눌러 저장하세요.
            </p>
          </div>
        ) : (
          // 카드 간격(gap) 축소
          <ul className="grid grid-cols-1 gap-4">
            {items.map((it) => (
              <li
                key={it.id}
                // 카드: 둥근 모서리(rounded), 그림자(shadow) 조정
                className="group rounded-xl bg-white shadow-md border border-gray-100/80 transition-all duration-300 overflow-hidden active:shadow-lg"
              >
                <div className="relative">
                  {/* 이미지 비율: 4:3으로 변경 (모바일에서 더 안정적) */}
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
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

                  {/* 찜 해제 버튼: 스타일 변경 (이미지 위에서 더 잘보이게) 및 크기/위치 조정 */}
                  <button
                    onClick={() => onRemove(it.id)}
                    className="absolute right-3 top-3 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 active:scale-95 transition-all duration-200"
                    title="찜 해제"
                    aria-label="찜 해제"
                  >
                    <Icon icon="mdi:close" className="text-lg" />
                  </button>
                </div>

                {/* 콘텐츠 영역: 패딩(p), 폰트 크기, 간격(mb, mt) 축소 */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {it.title}
                    </h3>
                    {/* 카테고리 태그: 더 컴팩트하게 */}
                    {it.category && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-medium whitespace-nowrap">
                        {it.category}
                      </span>
                    )}
                  </div>
                  {it.subtitle && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {it.subtitle}
                    </p>
                  )}
                  {/* 가격: 폰트 크기 및 색상 조정 */}
                  {typeof it.price === "number" && (
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      {it.price.toLocaleString()}원
                    </p>
                  )}
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
