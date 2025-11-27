// src/pages/MyPage/ClientMyPage/Coupons/WebView.tsx

import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import api from "../../../../../lib/api/axios";
import { useAppSelector } from "../../../../../store/hooks";

/** 모바일 뷰와 동일한 Coupon 타입 */
interface Coupon {
  userCouponId: number;
  status: "AVAILABLE" | "USED" | "EXPIRED" | "CANCELLED" | string;
  downloadedAt: string;
  usedAt: string | null;
  couponId: number;
  couponCode: string;
  couponName: string;
  couponDetail: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;
  startDate: string;
  expirationDate: string;
  category: string; // 백엔드에서 오는 RAW 값 (예: "DRESS", "WEDDING_HALL")
  canUse: boolean;
  daysUntilExpiration: number;
  productId: number | null;
  productName: string | null;
}

type CouponCategory = "전체" | "웨딩홀" | "스튜디오" | "드레스" | "메이크업";

// 백엔드 category → 프론트 탭 한글 카테고리 매핑 (모바일과 동일)
const BACKEND_CATEGORY_TO_KO: Record<string, CouponCategory> = {
  WEDDING_HALL: "웨딩홀",
  HALL: "웨딩홀",
  STUDIO: "스튜디오",
  DRESS: "드레스",
  MAKEUP: "메이크업",
  // 백엔드에서 혹시 한글로 내려오는 경우도 대비
  웨딩홀: "웨딩홀",
  스튜디오: "스튜디오",
  드레스: "드레스",
  메이크업: "메이크업",
};

/* ----- 공통 포맷 함수 (모바일과 동일) ----- */

// 숫자 포맷
const formatNumber = (value: number) => {
  if (value == null) return "";
  return new Intl.NumberFormat("ko-KR").format(value);
};

// 할인 표시
const formatDiscount = (discountType: string, discountValue: number) => {
  if (!discountValue) return "0원";

  if (discountType === "PERCENT" || discountType === "RATE") {
    return `${discountValue}%`;
  }

  return `${formatNumber(discountValue)}원`;
};

// 최소금액 조건
const formatCondition = (minPurchaseAmount: number) => {
  if (!minPurchaseAmount || minPurchaseAmount <= 0) {
    return "최소 주문금액 제한 없음";
  }
  return `최소 ${formatNumber(minPurchaseAmount)}원 이상 구매 시`;
};

// 날짜 포맷: 2025-01-01 -> 2025.01.01
const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, ".");
};

// 쿠폰의 실제(한글) 카테고리값으로 변환
const getCouponKoCategory = (rawCategory: string): CouponCategory | null => {
  return BACKEND_CATEGORY_TO_KO[rawCategory] ?? null;
};

export default function WebView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const isAuth = useAppSelector((s) => s.user.isAuth);

  const [category, setCategory] = useState<CouponCategory>("전체");
  const [sort, setSort] = useState<"최신순" | "오래된순">("최신순");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

  // 정렬 드롭다운 상태
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    if (!sortOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  /** 내 쿠폰 전체 조회 (모바일과 동일 엔드포인트) */
  useEffect(() => {
    if (!isAuth) {
      setCoupons([]);
      return;
    }

    const fetchMyCoupons = async () => {
      try {
        setLoading(true);
        const res = await api.get<Coupon[]>("/api/v1/customer/coupon/my");
        setCoupons(res.data || []);
      } catch (err) {
        console.error("[Coupon/WebView] fetchMyCoupons error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCoupons();
  }, [isAuth]);

  /** 카테고리 + 정렬 적용 리스트 (모바일처럼 사용 가능 위, 사용됨 아래) */
  const filtered = useMemo(() => {
    const list = coupons.filter((c) => {
      if (category === "전체") return true;
      const koCategory = getCouponKoCategory(c.category);
      if (!koCategory) return false;
      return koCategory === category;
    });

    // 우선순위:
    // 0: 사용 가능 (canUse && !USED)
    // 1: 사용 불가 (!canUse && !USED)
    // 2: 사용됨 (USED)
    const rank = (c: Coupon) => {
      const isUsed = c.status === "USED";
      if (isUsed) return 2;
      if (c.canUse) return 0;
      return 1;
    };

    list.sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;

      const da = +new Date(a.downloadedAt || a.startDate);
      const db = +new Date(b.downloadedAt || b.startDate);
      return sort === "최신순" ? db - da : da - db;
    });

    return list;
  }, [coupons, category, sort]);

  return (
    <div className="w-full min-h-screen bg-[#F3F5F9]">
      <div className="mx-auto max-w-[960px] px-6 lg:px-8 pt-5 pb-24">
        {/* 상단 타이틀 & 뒤로가기 */}
        <div className="flex items-center gap-3 mt-20 mb-6">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5"
          >
            <Icon
              icon="solar:alt-arrow-left-linear"
              className="w-5 h-5 text-[#111827]"
            />
          </button>
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
              {loading ? "쿠폰 불러오는 중..." : `보유 쿠폰 ${filtered.length}`}
            </span>

            {/* 정렬 드롭다운 */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                className="flex items-center gap-1 text-[14px] tracking-[-0.2px]"
                onClick={() => setSortOpen((prev) => !prev)}
              >
                {sort}
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className="w-4 h-4 text-[#9CA3AF]"
                />
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-30">
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
        </section>

        {/* 리스트 */}
        <section className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-[#E6E9EF] bg-white/80 p-12 text-center text-[14px] text-[#6B7280]">
              쿠폰 정보를 불러오는 중입니다...
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            filtered.map((c) => <CouponCard key={c.userCouponId} c={c} />)
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
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left px-4 py-2.5 text-[14px] leading-[21px] tracking-[-0.2px]",
        active ? "bg-gray-100 font-semibold" : "hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CouponCard({ c }: { c: Coupon }) {
  const discountLabel = formatDiscount(c.discountType, c.discountValue);
  const conditionLabel = formatCondition(c.minPurchaseAmount);
  const periodLabel = `${formatDate(c.startDate)} ~ ${formatDate(
    c.expirationDate
  )}`;

  const isUsed = c.status === "USED";
  const isApplicable = !isUsed && c.canUse;

  let statusLabel = "";
  let circleBg = "";
  let icon = "";
  let iconColor = "";
  let textColor = "";

  if (isUsed) {
    statusLabel = "사용됨";
    circleBg = "bg-[#F3F4F6]";
    icon = "mdi:check-all";
    iconColor = "text-[#6B7280]";
    textColor = "text-[#6B7280]";
  } else if (isApplicable) {
    statusLabel = "사용 가능";
    circleBg = "bg-[#ECFDF3]";
    icon = "mdi:check-circle-outline";
    iconColor = "text-[#16A34A]";
    textColor = "text-[#16A34A]";
  } else {
    statusLabel = "사용 불가";
    circleBg = "bg-[#F3F4F6]";
    icon = "mdi:close-circle-outline";
    iconColor = "text-[#9CA3AF]";
    textColor = "text-[#9CA3AF]";
  }

  return (
    <article className="relative flex overflow-hidden rounded-2xl bg-white border border-[#E6E9EF] shadow-sm">
      {/* 왼쪽: 쿠폰 정보 */}
      <div className={`flex-1 px-6 py-3 ${!isApplicable ? "opacity-50" : ""}`}>
        {/* 타이틀 */}
        <div className="flex items-start gap-2">
          <Icon
            icon="solar:ticket-sale-linear"
            className="mt-1 w-5 h-5 text-[#6B7280]"
            aria-hidden
          />
          <h3 className="text-[16px] leading-[22px] font-medium tracking-[-0.2px] text-[#111827]">
            {c.couponName}
          </h3>
        </div>

        {/* 할인값 */}
        <div className="mt-2 text-[22px] leading-[32px] font-bold tracking-[-0.2px] text-[#111827]">
          {discountLabel}
        </div>

        {/* 조건 & 기간 */}
        <div className="mt-2 space-y-1 text-[13px] leading-[18px] tracking-[-0.1px] text-[#6B7280]">
          <p className="line-clamp-1">{conditionLabel}</p>
          <p>{periodLabel}</p>
        </div>
      </div>

      {/* 오른쪽: 사용 여부 영역 (모바일 로직과 동일 컨셉) */}
      <div className="flex w-[120px] items-center justify-center bg-[#F6F7FB] border-l border-[#E6E9EF]">
        <div className="flex flex-col items-center gap-2">
          <div
            className={`flex items-center justify-center w-[40px] h-[40px] rounded-full ${circleBg}`}
          >
            <Icon icon={icon} className={`w-5 h-5 ${iconColor}`} />
          </div>
          <span
            className={`whitespace-nowrap text-[13px] font-medium ${textColor}`}
          >
            {statusLabel}
          </span>
        </div>
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
