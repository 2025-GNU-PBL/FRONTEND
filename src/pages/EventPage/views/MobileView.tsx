// views/MobileView.tsx — (사용자 제공 모바일 코드 그대로)
import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

type EventItem = {
  id: string;
  title: string;
  banner: string;
  period: string; // "YYYY.MM.DD ~ YYYY.MM.DD" or "상시"
  status: "ongoing" | "ended" | "always";
  summary: string;
};

const dummyEvents: EventItem[] = [
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
];

const statusMap: Record<
  EventItem["status"],
  { label: string; className: string }
> = {
  ongoing: { label: "진행중", className: "bg-[#E8FFF1] text-[#0F8A4D]" },
  ended: { label: "종료", className: "bg-[#F9E9E9] text-[#C0392B]" },
  always: { label: "상시", className: "bg-[#EEF2FF] text-[#3B5BDB]" },
};

const MobileView: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "ongoing" | "ended" | "always">(
    "all"
  );

  const events = useMemo(() => {
    if (filter === "all") return dummyEvents;
    return dummyEvents.filter((e) => e.status === filter);
  }, [filter]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-black/80">
      {/* 헤더 */}
      <header className="flex justify-between items-center m-5">
        <h1 className="font-allimjang text-[#FF2233] text-2xl font-bold">
          웨딩PICK
        </h1>
        <h2 className="text-lg font-semibold text-black/70">이벤트</h2>
      </header>

      {/* 바디 */}
      <main className="flex-1 px-5 pb-28">
        {/* 섹션 타이틀 */}
        <div className="text-[20px] font-semibold mb-5">
          <span className="text-[#FF2233]">EVENT</span>
          <span className="ml-1 text-black/70"> 특별 혜택</span>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mb-5">
          {[
            { key: "all", label: "전체" },
            { key: "ongoing", label: "진행중" },
            { key: "always", label: "상시" },
            { key: "ended", label: "종료" },
          ].map(({ key, label }) => {
            const isActive = filter === (key as typeof filter);
            return (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={[
                  "px-3 py-2 rounded-full text-sm transition-colors",
                  isActive
                    ? "bg-black text-white"
                    : "border border-[#D9D9D9] text-black",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* 이벤트 카드 리스트 */}
        <div className="grid grid-cols-1 gap-4">
          {events.map((ev) => {
            const badge = statusMap[ev.status];
            return (
              <article
                key={ev.id}
                className="rounded-[16px] border border-gray-200 overflow-hidden bg-white"
              >
                {/* 배너 */}
                <div className="w-full h-[160px] bg-[#F3F4F5]">
                  <img
                    src={ev.banner}
                    alt={ev.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 내용 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold text-black">
                      {ev.title}
                    </h3>
                    <span
                      className={[
                        "text-xs px-2 py-1 rounded-[8px] font-medium",
                        badge.className,
                      ].join(" ")}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-xs text-[#8C8C8C] mb-2">{ev.period}</p>
                  <p className="text-sm text-[#333333] leading-relaxed">
                    {ev.summary}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <button className="text-sm text-[#595F63] hover:text-black underline underline-offset-4">
                      자세히 보기
                    </button>
                    <button className="flex items-center gap-1 text-sm font-medium text-white bg-[#FF2233] px-3 py-2 rounded-[10px] hover:bg-[#e61e2d] active:scale-95 transition">
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

        {/* 안내 박스 */}
        <div className="mt-8 rounded-[12px] bg-[#F3F4F5] p-4 flex items-start gap-3">
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
      </main>
    </div>
  );
};

export default MobileView;
