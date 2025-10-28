// WebView.tsx (FAQ - Desktop Only)
import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

type FaqItem = {
  q: string;
  a: string;
  category: "예약" | "스드메" | "결제/환불" | "계정/기타";
  tags?: string[];
};

const ALL = "전체";

const CATEGORIES = [ALL, "예약", "스드메", "결제/환불", "계정/기타"] as const;

const RAW_FAQS: FaqItem[] = [
  {
    q: "웨딩홀 예약은 어떻게 하나요?",
    a: "웨딩홀 상세 페이지에서 원하는 날짜·인원·예산을 선택 후 ‘예약 신청’을 진행하면 담당 매니저가 확인 후 연락드립니다.",
    category: "예약",
    tags: ["웨딩홀", "예약", "일정"],
  },
  {
    q: "스튜디오, 드레스, 메이크업은 함께 예약이 가능한가요?",
    a: "네. 스드메 패키지로 묶음 예약이 가능하며, 개별 선택도 지원합니다. 패키지 페이지에서 견적 비교 후 신청하세요.",
    category: "스드메",
    tags: ["스드메", "패키지", "견적"],
  },
  {
    q: "예약 취소 시 환불 규정은 어떻게 되나요?",
    a: "업체별 취소·환불 정책이 상이합니다. 예약 내역 > 상세 보기에서 ‘취소/환불 규정’을 확인하실 수 있습니다.",
    category: "결제/환불",
    tags: ["환불", "취소", "정책"],
  },
  {
    q: "회원가입 없이 견적을 볼 수 있나요?",
    a: "비회원도 기본 조건 입력만으로 즉시 견적 조회가 가능합니다. 단, 실제 예약은 회원 전용입니다.",
    category: "계정/기타",
    tags: ["비회원", "견적", "회원"],
  },
  {
    q: "고객센터 운영시간이 어떻게 되나요?",
    a: "평일 10:00–18:00 운영 (주말·공휴일 휴무). 채팅 문의는 페이지 우상단 ‘문의하기’ 버튼으로 남겨주세요.",
    category: "계정/기타",
    tags: ["운영시간", "고객센터"],
  },
  // 웹 전용 더미 FAQ (예시 확장)
  {
    q: "예약 확정까지 얼마나 걸리나요?",
    a: "보통 영업일 기준 1–2일 내 확정되며, 추가 정보가 필요하면 별도 연락을 드립니다.",
    category: "예약",
    tags: ["확정", "리드타임"],
  },
  {
    q: "계약금 결제 수단은 무엇을 지원하나요?",
    a: "신용/체크카드, 계좌이체, 간편결제를 지원합니다. 일부 업체는 무이자 할부 이벤트가 적용됩니다.",
    category: "결제/환불",
    tags: ["결제", "할부", "이벤트"],
  },
  {
    q: "스드메 리허설 촬영 일정 변경이 가능한가요?",
    a: "가능합니다. 다만 스튜디오 스케줄 상황에 따라 변경 수수료가 발생할 수 있습니다.",
    category: "스드메",
    tags: ["리허설", "일정변경"],
  },
];

const WebView = () => {
  // UI states
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<(typeof CATEGORIES)[number]>(ALL);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RAW_FAQS.filter((item) => {
      const inCategory =
        activeCategory === ALL ? true : item.category === activeCategory;
      const inText =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(q));
      return inCategory && inText;
    });
  }, [query, activeCategory]);

  const countsByCategory = useMemo(() => {
    const base: Record<string, number> = {};
    CATEGORIES.forEach((c) => (base[c] = 0));
    RAW_FAQS.forEach((f) => {
      base["전체"] += 1;
      base[f.category] = (base[f.category] || 0) + 1;
    });
    return base;
  }, []);

  const handleToggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div>
      {/* 상단 여백: 고정 네브바 높이 보정 */}
      <div className="pt-20" />

      {/* 메인 컨테이너 */}
      <div className="mx-auto max-w-[1120px] px-8 pb-24">
        {/* 헤더 라인 */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[28px] font-semibold">
              <span className="text-[#FF2233]">FAQ</span>
              <span className="ml-2 text-black/70">자주 묻는 질문</span>
            </div>
            <p className="text-sm text-black/50 mt-1">
              빠르게 찾고, 바로 해결하세요. 검색과 카테고리 필터를 지원합니다.
            </p>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#FF2233] px-4 py-2 text-white text-sm font-medium hover:bg-[#e61e2d] transition"
            onClick={() => {
              // 필요 시 라우팅/모달 연결
              console.log("문의하기 클릭");
            }}
          >
            <Icon icon="solar:chat-square-outline" className="w-5 h-5" />
            문의하기
          </button>
        </div>

        {/* 검색 + 카테고리 */}
        <div className="flex gap-6">
          {/* 좌측: 콘텐츠 영역 */}
          <div className="flex-1">
            {/* 검색바 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 rounded-[12px] border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <Icon
                  icon="solar:magnifer-linear"
                  className="w-5 h-5 text-gray-500"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="검색어를 입력하세요 (예: 환불, 스드메, 일정)"
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-black/40"
                />
                {query && (
                  <button
                    className="text-black/50 hover:text-black/80"
                    onClick={() => setQuery("")}
                    aria-label="검색어 지우기"
                  >
                    <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="mt-2 text-xs text-black/50">
                총{" "}
                <span className="font-semibold text-black/70">
                  {filteredFaqs.length}
                </span>
                건 결과
              </div>
            </div>

            {/* 카테고리 탭 */}
            <div className="mb-5 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={[
                      "rounded-full px-4 py-2 text-sm border transition",
                      active
                        ? "bg-[#7E57C2] text-white border-transparent shadow-sm"
                        : "bg-white text-black/70 border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {cat}{" "}
                    <span className={active ? "opacity-90" : "text-black/40"}>
                      ({countsByCategory[cat] ?? 0})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* FAQ 리스트 (아코디언) */}
            <div className="space-y-3">
              {filteredFaqs.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-[14px] border border-gray-200 bg-white"
                  >
                    <button
                      onClick={() => handleToggle(idx)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#FAFAFA] transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#FFF1F2] text-[#FF2233] text-xs font-semibold px-2.5 py-1 border border-[#ffe2e5]">
                          {item.category}
                        </span>
                        <span className="text-[15px] font-medium text-[#333]">
                          {item.q}
                        </span>
                      </div>
                      <Icon
                        icon={
                          isOpen
                            ? "solar:alt-arrow-up-linear"
                            : "solar:alt-arrow-down-linear"
                        }
                        className="w-5 h-5 text-gray-500"
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100 bg-[#FAFAFA] px-5 py-4">
                        <p className="text-sm leading-relaxed text-[#595F63]">
                          {item.a}
                        </p>

                        {item.tags && item.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-black/60"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredFaqs.length === 0 && (
                <div className="rounded-[12px] border border-dashed border-gray-300 bg-white p-8 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                    <Icon
                      icon="solar:confetti-minimalistic-linear"
                      className="h-5 w-5 text-gray-500"
                    />
                  </div>
                  <p className="text-sm text-black/70">
                    검색 조건에 맞는 FAQ가 없습니다.
                  </p>
                  <p className="mt-1 text-xs text-black/50">
                    다른 키워드로 다시 시도하거나, 우측 문의 채널을
                    이용해주세요.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 사이드바 */}
          <aside className="w-[300px] shrink-0 space-y-4">
            {/* 고객센터 카드 */}
            <div className="rounded-[14px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Icon
                  icon="solar:headphones-round-linear"
                  className="h-5 w-5 text-[#FF2233]"
                />
                <h3 className="text-sm font-semibold text-black">
                  고객센터 도움말
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-black/70">
                <li className="flex items-center gap-2">
                  <Icon icon="solar:clock-circle-linear" className="w-4 h-4" />
                  <span>
                    운영시간: <b>평일 10:00–18:00</b> (주말·공휴일 휴무)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon icon="solar:call-outline" className="w-4 h-4" />
                  <span>전화: 1588-0000</span>
                </li>
                <li className="flex items-center gap-2">
                  <Icon icon="solar:letter-linear" className="w-4 h-4" />
                  <span>이메일: help@weddingpick.kr</span>
                </li>
              </ul>

              <button
                className="mt-4 w-full rounded-[10px] bg-[#7E57C2] px-4 py-2 text-sm font-medium text-white hover:brightness-95 transition"
                onClick={() => console.log("채팅 문의 열기")}
              >
                실시간 채팅 문의
              </button>
            </div>

            {/* 빠른 바로가기 */}
            <div className="rounded-[14px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Icon
                  icon="solar:bookmark-circle-linear"
                  className="h-5 w-5 text-[#7E57C2]"
                />
                <h3 className="text-sm font-semibold text-black">
                  빠른 바로가기
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "예약내역",
                    icon: "solar:calendar-mark-line-duotone",
                  },
                  { label: "취소/환불", icon: "solar:bill-list-linear" },
                  { label: "스드메 패키지", icon: "solar:gallery-wide-linear" },
                  { label: "개인정보 수정", icon: "solar:user-linear" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-left text-sm text-black/70 hover:bg-gray-50 transition"
                    onClick={() => console.log(`${item.label} 이동`)}
                  >
                    <Icon icon={item.icon} className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 도움이 되었나요? */}
            <div className="rounded-[14px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Icon
                  icon="solar:smile-circle-linear"
                  className="h-5 w-5 text-[#FF2233]"
                />
                <h3 className="text-sm font-semibold text-black">
                  이 페이지가 도움이 되었나요?
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition"
                  onClick={() => console.log("Helpful: yes")}
                >
                  <Icon icon="solar:like-linear" className="w-4 h-4" />
                  네, 좋아요
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 transition"
                  onClick={() => console.log("Helpful: no")}
                >
                  <Icon icon="solar:dislike-linear" className="w-4 h-4" />
                  아니요
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default WebView;
