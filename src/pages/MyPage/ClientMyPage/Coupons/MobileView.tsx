import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import MyPageHeader from "../../../../components/MyPageHeader";

type Coupon = {
  id: string;
  category: "전체" | "웨딩홀" | "스튜디오" | "드레스" | "메이크업";
  title: string;
  discount: string;
  info1: string;
  period: string;
  createdAt: string;
};

// 데모 데이터
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

export default function MobileView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const [category, setCategory] = useState<Coupon["category"]>("전체");
  const [sort, setSort] = useState<"최신순" | "오래된순">("최신순");
  const [sortOpen, setSortOpen] = useState(false);

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

  // 바깥 클릭으로 정렬 메뉴 닫기
  const popRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    if (sortOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [sortOpen]);

  return (
    <div className="w-full bg-white">
      {/* 화면 프레임(390×844) */}
      <div className="mx-auto w-[390px] h-[844px] bg-[#F6F7FB] flex flex-col">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-[#F6F7FB] border-b border-gray-200">
          <MyPageHeader title="쿠폰함" onBack={onBack} showMenu={false} />
        </div>

        {/* 본문 */}
        <div className="flex-1 px-5 pt-4 pb-20 overflow-auto">
          {/* 카테고리 칩 */}
          <div className="w-full flex items-center gap-2">
            <Chip
              label="전체"
              className="w-[48px]"
              onClick={() => setCategory("전체")}
              isActive={category === "전체"}
            />
            <Chip
              label="웨딩홀"
              className="w-[60px]"
              onClick={() => setCategory("웨딩홀")}
              isActive={category === "웨딩홀"}
            />
            <Chip
              label="스튜디오"
              className="w-[72px]"
              onClick={() => setCategory("스튜디오")}
              isActive={category === "스튜디오"}
            />
            <Chip
              label="드레스"
              className="w-[60px]"
              onClick={() => setCategory("드레스")}
              isActive={category === "드레스"}
            />
            <Chip
              label="메이크업"
              className="w-[72px]"
              onClick={() => setCategory("메이크업")}
              isActive={category === "메이크업"}
            />
          </div>

          {/* 보유개수 / 정렬 */}
          <div className="mt-4 w-full flex items-center justify-between relative">
            <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
              보유 쿠폰 {filtered.length}
            </span>

            {/* 정렬 드롭다운 */}
            <div className="relative" ref={popRef}>
              <button
                className="flex items-center gap-1"
                onClick={() => setSortOpen((p) => !p)}
                aria-haspopup="menu"
                aria-expanded={sortOpen}
              >
                <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
                  {sort}
                </span>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className="w-4 h-4 text-[#999999]"
                />
              </button>

              {sortOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-36 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-30"
                >
                  <SortItem
                    active={sort === "최신순"}
                    onClick={() => {
                      setSort("최신순");
                      setSortOpen(false);
                    }}
                  >
                    최신순
                  </SortItem>
                  <SortItem
                    active={sort === "오래된순"}
                    onClick={() => {
                      setSort("오래된순");
                      setSortOpen(false);
                    }}
                  >
                    오래된순
                  </SortItem>
                </div>
              )}
            </div>
          </div>

          {/* 리스트 */}
          <div className="mt-4 flex flex-col gap-4">
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((c) => <CouponCard key={c.id} c={c} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={[
        "w-full text-left px-4 py-3 text-[14px] leading-[21px] tracking-[-0.2px]",
        active ? "bg-gray-100 font-semibold" : "hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Chip({
  label,
  onClick,
  isActive,
  className = "",
}: {
  label: string;
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center h-[37px] px-4 rounded-[20px]",
        "text-[14px] leading-[21px] tracking-[-0.2px] whitespace-nowrap text-center",
        isActive
          ? "bg-black text-white"
          : "bg-[#FEFFFF] text-black border border-[#D9D9D9]",
        className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function CouponCard({ c }: { c: Coupon }) {
  return (
    <div className="w-full h-[129px] flex">
      {/* 좌측 본문 */}
      <div className="w-[278px] h-[129px] border border-r-0 border-[#F2F2F2] rounded-l-[16px] p-4 flex flex-col gap-2 bg-white">
        <div className="flex flex-col gap-1 w-[222px]">
          <div className="text-[14px] leading-[21px] tracking-[-0.2px] text-black">
            {c.title}
          </div>
          <div className="text-[20px] font-bold leading-[32px] tracking-[-0.2px] text-black">
            {c.discount}
          </div>
        </div>
        <div className="flex flex-col w-[169px]">
          <div className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
            {c.info1}
          </div>
          <div className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#999999]">
            {c.period}
          </div>
        </div>
      </div>

      {/* 우측 다운로드 영역 */}
      <div className="w-[72px] h-[129px] bg-[#F6F7FB] border border-l-0 border-[#F2F2F2] rounded-r-[16px] flex items-center justify-center px-[18px]">
        <button
          className="w-9 h-9 rounded-[20px] bg-white flex items-center justify-center active:scale-95"
          aria-label="download-coupon"
          onClick={() => alert("쿠폰이 다운로드되었습니다.")}
        >
          <Icon icon="mdi:download-outline" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Icon
          icon="material-symbols:credit-card-outline"
          className="w-[80px] h-[80px] opacity-50"
        />
        <p className="text-center font-semibold text-[18px] leading-[29px] tracking-[-0.2px] text-black">
          보유중인 쿠폰이 없어요
        </p>
      </div>
    </div>
  );
}
