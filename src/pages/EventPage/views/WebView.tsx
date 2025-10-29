// views/WebView.tsx — Event Page (Desktop Only)
// - 데스크톱 전용 렌더링: 부모에서 hidden/md:block 분기
// - 고정 네브바 상단 여백 보정(pt-20)
// - 검색 / 상태별 필터 / 정렬 / 카드 그리드 / 간단 페이지네이션

import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

type EventItem = {
  id: string;
  title: string;
  banner: string;
  period: string; // "YYYY.MM.DD ~ YYYY.MM.DD" | "상시"
  status: "ongoing" | "ended" | "always";
  summary: string;
};

const statusMap: Record<
  EventItem["status"],
  { label: string; className: string }
> = {
  ongoing: { label: "진행중", className: "bg-[#E8FFF1] text-[#0F8A4D]" },
  ended: { label: "종료", className: "bg-[#F9E9E9] text-[#C0392B]" },
  always: { label: "상시", className: "bg-[#EEF2FF] text-[#3B5BDB]" },
};

// ✅ 더미 데이터 (웹 전용 확장)
const DUMMY_EVENTS: EventItem[] = [
  {
    id: "e1",
    title: "가을 웨딩홀 특별 할인",
    banner:
      "https://www.thefirstmedia.net/news/photo/202310/130540_113386_4132.jpg",
    period: "2025.09.01 ~ 2025.11.30",
    status: "ongoing",
    summary: "가을 시즌 한정 웨딩홀 대관료/식대 할인 혜택을 만나보세요.",
  },
  {
    id: "e2",
    title: "스드메 패키지 얼리버드",
    banner: "https://img.hankyung.com/photo/202403/99.12197822.1.jpg",
    period: "상시",
    status: "always",
    summary: "스튜디오·드레스·메이크업 패키지를 조기 예약 시 추가 혜택 제공.",
  },
  {
    id: "e3",
    title: "청첩장 제휴 이벤트",
    banner:
      "https://www.itscard.co.kr/image/renewal2025/main/itspick04_5640.jpg",
    period: "2025.05.01 ~ 2025.07.31",
    status: "ended",
    summary: "제휴 업체 청첩장 주문 시 10% 추가 할인 (이벤트 종료).",
  },
  {
    id: "e4",
    title: "봄 신상 드레스 피팅 위크",
    banner:
      "https://img.freepik.com/free-photo/beautiful-bride-wedding-dress_144627-6282.jpg",
    period: "2026.03.10 ~ 2026.03.24",
    status: "ongoing",
    summary: "신상 드레스를 합리적인 가격으로 체험해보세요.",
  },
  {
    id: "e5",
    title: "프리미엄 메이크업 체험단 모집",
    banner:
      "https://img.freepik.com/free-photo/female-makeup-artist-applies-makeup-woman_186382-868.jpg",
    period: "2026.01.01 ~ 2026.01.31",
    status: "ended",
    summary: "전문 아티스트와 함께하는 1:1 메이크업 리허설 체험.",
  },
  {
    id: "e6",
    title: "주말 스튜디오 야외 촬영 프로모션",
    banner:
      "https://img.freepik.com/free-photo/photographer-taking-pictures-beautiful-bride_23-2148203075.jpg",
    period: "상시",
    status: "always",
    summary: "야외 스냅 촬영을 상시 특가로 제공합니다.",
  },
  {
    id: "e7",
    title: "겨울 웨딩홀 런치 뷔페 업그레이드",
    banner:
      "https://img.freepik.com/free-photo/buffet-with-variety-food_144627-25680.jpg",
    period: "2025.12.01 ~ 2026.02.28",
    status: "ongoing",
    summary: "런치 타임 예약 고객 대상 프리미엄 메뉴 업그레이드.",
  },
  {
    id: "e8",
    title: "주중 촬영 10% 즉시할인",
    banner:
      "https://img.freepik.com/free-photo/beautiful-bride-groom_1157-31915.jpg",
    period: "2025.10.01 ~ 2025.12.31",
    status: "ongoing",
    summary: "주중(월–금) 촬영 예약 시 추가 할인 적용.",
  },
  {
    id: "e9",
    title: "포토부스 무료 쿠폰 증정",
    banner:
      "https://img.freepik.com/free-photo/photo-booth-party_23-2148197542.jpg",
    period: "2025.06.01 ~ 2025.06.30",
    status: "ended",
    summary: "예약 고객 전원에게 포토부스 1회 무료 쿠폰 제공 (종료).",
  },
  {
    id: "e10",
    title: "VIP 전용 라운지 투어",
    banner:
      "https://img.freepik.com/free-photo/luxury-hotel-lobby-interior_1203-2305.jpg",
    period: "상시",
    status: "always",
    summary: "VIP 고객을 위한 프라이빗 라운지 투어를 상시 운영합니다.",
  },
  {
    id: "e11",
    title: "하객 식사 업그레이드 패키지",
    banner:
      "https://img.freepik.com/free-photo/banquet-table-with-snacks_140725-769.jpg",
    period: "2025.11.01 ~ 2026.01.15",
    status: "ongoing",
    summary: "하객 만족도를 높이는 메뉴 업그레이드 패키지.",
  },
  {
    id: "e12",
    title: "스드메 통합 예약 페스티벌",
    banner:
      "https://img.freepik.com/free-photo/wedding-dress-studio_23-2148882018.jpg",
    period: "2025.10.15 ~ 2025.11.30",
    status: "ongoing",
    summary: "통합 예약 시 사은품과 추가 할인 혜택을 제공해요.",
  },
];

// 날짜 파싱: "YYYY.MM.DD ~ YYYY.MM.DD" 형태만 처리 (상시는 null 반환)
function parsePeriodToDates(period: string): {
  start: Date | null;
  end: Date | null;
} {
  if (period === "상시") return { start: null, end: null };
  const match = period.match(
    /(\d{4})\.(\d{2})\.(\d{2})\s*~\s*(\d{4})\.(\d{2})\.(\d{2})/
  );
  if (!match) return { start: null, end: null };
  const [, ys, ms, ds, ye, me, de] = match.map(String);
  const start = new Date(Number(ys), Number(ms) - 1, Number(ds), 0, 0, 0);
  const end = new Date(Number(ye), Number(me) - 1, Number(de), 23, 59, 59);
  return { start, end };
}

function daysLeft(period: string): number | null {
  const { end } = parsePeriodToDates(period);
  if (!end) return null;
  const now = new Date();
  const diff = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

type FilterKey = "all" | "ongoing" | "always" | "ended";
type SortKey = "latestEnd" | "soonEnd" | "titleAsc";

const WebView: React.FC = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("soonEnd");
  const [page, setPage] = useState(1);

  const pageSize = 9; // 데스크톱 카드 3열 x 3행

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DUMMY_EVENTS.filter((e) => {
      const inFilter = filter === "all" ? true : e.status === filter;
      const inQuery =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q);
      return inFilter && inQuery;
    });
  }, [query, filter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortBy === "titleAsc") {
        return a.title.localeCompare(b.title, "ko");
      }
      const da = parsePeriodToDates(a.period).end;
      const db = parsePeriodToDates(b.period).end;

      // 상시 or 파싱 실패한 경우 뒤로 밀기 위한 가중치
      const weight = (d: Date | null) => (d ? 0 : 1);

      if (sortBy === "soonEnd") {
        // 종료 임박(가까운 종료일 우선) → 상시/무기한은 뒤로
        const wa = weight(da);
        const wb = weight(db);
        if (wa !== wb) return wa - wb;
        if (!da || !db) return 0;
        return da.getTime() - db.getTime();
      }

      if (sortBy === "latestEnd") {
        // 종료일 최신순(먼 종료일 우선)
        const wa = weight(da);
        const wb = weight(db);
        if (wa !== wb) return wa - wb;
        if (!da || !db) return 0;
        return db.getTime() - da.getTime();
      }

      return 0;
    });
    return arr;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  // 페이지가 바뀌어도 붙어있도록 스크롤 위치 보정 (선택)
  const goPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setPage(clamped);
  };

  return (
    <div className="hidden md:block">
      {/* 고정 네브바 보정 */}
      <div className="pt-20" />

      <div className="mx-auto max-w-[1120px] px-8 pb-24">
        {/* 헤더 */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-semibold">
              <span className="text-[#FF2233]">EVENT</span>
              <span className="ml-2 text-black/70"> 특별 혜택</span>
            </h1>
            <p className="mt-1 text-sm text-black/50">
              진행중/상시/종료 이벤트를 빠르게 찾아보세요.
            </p>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#FF2233] px-4 py-2 text-sm font-medium text-white hover:bg-[#e61e2d] transition"
            onClick={() => console.log("이벤트 제안/문의")}
          >
            <Icon icon="solar:chat-square-outline" className="w-5 h-5" />
            제안/문의
          </button>
        </div>

        {/* 검색/필터/정렬 */}
        <div className="mb-5 flex items-center gap-4">
          {/* 검색 */}
          <div className="flex flex-1 items-center gap-2 rounded-[12px] border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <Icon
              icon="solar:magnifer-linear"
              className="w-5 h-5 text-gray-500"
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="검색: 웨딩홀, 드레스, 메이크업…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-black/40"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
                className="text-black/50 hover:text-black/80"
                aria-label="검색어 지우기"
              >
                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 정렬 */}
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:sort-from-bottom-to-top-bold"
              className="w-5 h-5 text-gray-500"
            />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortKey);
                setPage(1);
              }}
              className="rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="soonEnd">마감 임박순</option>
              <option value="latestEnd">마감 최신순</option>
              <option value="titleAsc">제목 오름차순</option>
            </select>
          </div>
        </div>

        {/* 상태 필터 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: "전체" },
              { key: "ongoing", label: "진행중" },
              { key: "always", label: "상시" },
              { key: "ended", label: "종료" },
            ] as { key: FilterKey; label: string }[]
          ).map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  setPage(1);
                }}
                className={[
                  "rounded-full px-4 py-2 text-sm border transition",
                  active
                    ? "bg-[#7E57C2] text-white border-transparent shadow-sm"
                    : "bg-white text-black/70 border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
          <div className="ml-auto text-xs text-black/50">
            총{" "}
            <span className="font-semibold text-black/70">
              {filtered.length}
            </span>
            건
          </div>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-3 gap-6">
          {paged.map((ev) => {
            const badge = statusMap[ev.status];
            const dleft = ev.status === "ongoing" ? daysLeft(ev.period) : null;

            return (
              <article
                key={ev.id}
                className="group rounded-[16px] border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow"
              >
                {/* 배너 */}
                <div className="relative w-full h-[180px] bg-[#F3F4F5]">
                  <img
                    src={ev.banner}
                    alt={ev.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* 진행중 D-day 뱃지 */}
                  {typeof dleft === "number" && (
                    <div className="absolute top-3 left-3 rounded-full bg-black/70 text-white text-xs px-3 py-1">
                      {dleft >= 0 ? `D-${dleft}` : `종료 D+${Math.abs(dleft)}`}
                    </div>
                  )}
                </div>

                {/* 내용 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="line-clamp-1 text-base font-semibold text-black">
                      {ev.title}
                    </h3>
                    <span
                      className={[
                        "text-xs px-2 py-1 rounded-[8px] font-medium whitespace-nowrap",
                        badge.className,
                      ].join(" ")}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs text-[#8C8C8C] mb-2">{ev.period}</p>
                  <p className="text-sm text-[#333333] leading-relaxed line-clamp-2">
                    {ev.summary}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      className="text-sm text-[#595F63] hover:text-black underline underline-offset-4"
                      onClick={() => console.log(`자세히 보기: ${ev.id}`)}
                    >
                      자세히 보기
                    </button>
                    <button
                      className="flex items-center gap-1 text-sm font-medium text-white bg-[#FF2233] px-3 py-2 rounded-[10px] hover:bg-[#e61e2d] active:scale-95 transition"
                      onClick={() => console.log(`참여하기: ${ev.id}`)}
                    >
                      참여하기
                      <Icon
                        icon="solar:alt-arrow-right-linear"
                        className="w-4 h-4"
                      />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
              onClick={() => goPage(page - 1)}
              disabled={page <= 1}
            >
              이전
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const active = p === page;
                return (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    className={[
                      "h-8 w-8 rounded-md border text-sm",
                      active
                        ? "bg-[#7E57C2] text-white border-transparent"
                        : "bg-white text-black/70 border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
              onClick={() => goPage(page + 1)}
              disabled={page >= totalPages}
            >
              다음
            </button>
          </div>
        )}

        {/* 안내 박스 */}
        <div className="mt-10 rounded-[12px] bg-[#F3F4F5] p-5 flex items-start gap-3">
          <Icon
            icon="solar:info-circle-line-duotone"
            className="w-6 h-6 text-[#FF2233]"
          />
          <div>
            <p className="text-sm text-black font-medium">유의사항</p>
            <ul className="list-disc pl-5 text-xs text-[#666] mt-1 space-y-1">
              <li>이벤트별 상세 조건 및 기간은 변경될 수 있습니다.</li>
              <li>일부 혜택은 제휴사 사정에 따라 조기 종료될 수 있습니다.</li>
              <li>자세한 내용은 각 이벤트의 상세 페이지에서 확인해주세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebView;
