import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

type Coupon = {
  id: string;
  category: "전체" | "웨딩홀" | "스튜디오" | "드레스" | "메이크업";
  title: string;
  discount: string;
  info1: string;
  period: string;
  createdAt: string;
};

// 모바일과 동일한 데모 데이터
const SEED: Coupon[] = [
  {
    id: "c1",
    category: "웨딩홀",
    title: "[상반기 WEDDING] 구매금액 1만원 할인",
    discount: "6%",
    info1: "10만원 이상 구매 시 최대 1만원 할인",
    period: "사용기간 : 25.09.29~25.10.31",
    createdAt: "2025-09-29",
  },
  {
    id: "c2",
    category: "스튜디오",
    title: "[상반기 WEDDING] 구매금액 1만원 할인",
    discount: "6%",
    info1: "10만원 이상 구매 시 최대 1만원 할인",
    period: "사용기간 : 25.09.29~25.10.31",
    createdAt: "2025-09-30",
  },
  {
    id: "c3",
    category: "드레스",
    title: "[상반기 WEDDING] 구매금액 1만원 할인",
    discount: "6%",
    info1: "10만원 이상 구매 시 최대 1만원 할인",
    period: "사용기간 : 25.09.29~25.10.31",
    createdAt: "2025-10-01",
  },
];

export default function WebView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [category, setCategory] = useState<Coupon["category"]>("전체");
  const [sort, setSort] = useState<"최신순" | "오래된순">("최신순");

  const filtered = useMemo(() => {
    const base =
      category === "전체"
        ? SEED.slice()
        : SEED.filter((c) => c.category === category);
    base.sort((a, b) =>
      sort === "최신순"
        ? +new Date(b.createdAt) - +new Date(a.createdAt)
        : +new Date(a.createdAt) - +new Date(b.createdAt)
    );
    return base;
  }, [category, sort]);

  return (
    <div className="w-full min-h-screen bg-[#F3F5F9]">
      {/* 중앙 1열 레이아웃: 화면 상단과 여백을 넉넉히 */}
      <div className="mx-auto max-w-[960px] px-6 lg:px-8 pt-10 pb-24">
        {/* 상단 타이틀 라인 */}
        <div className="flex items-center gap-3 mt-20 mb-6">
          <h1 className="text-[22px] font-semibold tracking-[-0.2px] text-[#111827]">
            쿠폰함
          </h1>
        </div>

        {/* 필터 바 */}
        <section className="bg-white border border-[#E6E9EF] rounded-2xl shadow-sm px-5 md:px-6 py-5 mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <Chip
              label="전체"
              onClick={() => setCategory("전체")}
              isActive={category === "전체"}
            />
            <Chip
              label="웨딩홀"
              onClick={() => setCategory("웨딩홀")}
              isActive={category === "웨딩홀"}
            />
            <Chip
              label="스튜디오"
              onClick={() => setCategory("스튜디오")}
              isActive={category === "스튜디오"}
            />
            <Chip
              label="드레스"
              onClick={() => setCategory("드레스")}
              isActive={category === "드레스"}
            />
            <Chip
              label="메이크업"
              onClick={() => setCategory("메이크업")}
              isActive={category === "메이크업"}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[14px] text-[#111827] tracking-[-0.2px]">
              보유 쿠폰 {filtered.length}
            </span>
            <button
              className="flex items-center gap-1 text-[14px] tracking-[-0.2px]"
              onClick={() =>
                setSort((p) => (p === "최신순" ? "오래된순" : "최신순"))
              }
            >
              {sort}
              <Icon
                icon="solar:alt-arrow-down-linear"
                className="w-4 h-4 text-[#9CA3AF]"
              />
            </button>
          </div>
        </section>

        {/* 리스트 */}
        <section className="space-y-4">
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            filtered.map((c) => <CouponCard key={c.id} c={c} />)
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function Chip({
  label,
  onClick,
  isActive,
}: {
  label: string;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex h-9 items-center justify-center rounded-full px-4",
        "text-[14px] leading-[21px] tracking-[-0.2px] whitespace-nowrap",
        isActive
          ? "bg-black text-white shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
          : "bg-white text-black border border-[#E2E5EA] hover:bg-[#F7F8FA]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function CouponCard({ c }: { c: Coupon }) {
  return (
    <article className="relative overflow-hidden rounded-2xl bg-white border border-[#E6E9EF] shadow-sm px-6 py-5">
      {/* 오른쪽 은은한 스트립 */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[96px] bg-[#F6F7FB]" />

      {/* 상단: 타이틀 (+ 쿠폰 아이콘) */}
      <div className="relative flex items-start gap-2 pr-[110px]">
        <Icon
          icon="solar:ticket-sale-linear"
          className="mt-1 w-5 h-5 text-[#6B7280]"
          aria-hidden
        />
        <h3 className="text-[16px] leading-[22px] font-medium tracking-[-0.2px] text-[#111827]">
          {c.title}
        </h3>
      </div>

      {/* 본문: 할인값 / 설명 */}
      <div className="relative mt-2 pr-[110px]">
        <div className="text-[22px] leading-[32px] font-bold tracking-[-0.2px] text-[#111827]">
          {c.discount}
        </div>
        <div className="mt-2 space-y-1 text-[13px] leading-[18px] tracking-[-0.1px] text-[#6B7280]">
          <p>{c.info1}</p>
          <p>{c.period}</p>
        </div>
      </div>

      {/* 다운로드 버튼 (카드 안, 오른쪽 중앙) */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2">
        <button
          className="w-10 h-10 rounded-full bg-white shadow-md ring-1 ring-black/5 flex items-center justify-center hover:translate-y-[-1px] transition-transform"
          aria-label="쿠폰 다운로드"
          onClick={() => alert("쿠폰이 다운로드되었습니다.")}
        >
          <Icon
            icon="mdi:download-outline"
            className="w-5 h-5 text-[#111827]"
          />
        </button>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[#D9DEE7] bg-white/60 p-12 text-center">
      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#F1F3F7]">
        <Icon
          icon="material-symbols:credit-card-outline"
          className="h-12 w-12 opacity-60"
        />
      </div>
      <p className="text-[15px] text-[#6B7280]">보유중인 쿠폰이 없어요</p>
    </div>
  );
}
