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

/** 백엔드 CustomerCouponResponseDto 구조 기준 */
type UserCoupon = {
  userCouponId: number;
  status: "AVAILABLE" | "USED" | "EXPIRED" | string;
  downloadedAt: string;
  usedAt: string | null;
  couponId: number;
  couponCode: string;
  couponName: string;
  couponDetail: string;
  discountType: string; // PERCENT, AMOUNT 등
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;
  startDate: string;
  expirationDate: string;
  category: string; // "웨딩홀" | "스튜디오" | ...
  canUse: boolean;
  daysUntilExpiration: number;
  productId: number | null;
  productName: string | null;
};

type CategoryFilter = "전체" | "웨딩홀" | "스튜디오" | "드레스" | "메이크업";

export default function WebView() {
  const nav = useNavigate();
  const onBack = useCallback(() => nav(-1), [nav]);

  const isAuth = useAppSelector((s) => s.user.isAuth);

  const [category, setCategory] = useState<CategoryFilter>("전체");
  const [sort, setSort] = useState<"최신순" | "오래된순">("최신순");
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
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

  /** 내 사용 가능한 쿠폰 조회 */
  useEffect(() => {
    if (!isAuth) {
      setCoupons([]);
      return;
    }

    const fetchMyCoupons = async () => {
      try {
        setLoading(true);
        const res = await api.get<UserCoupon[]>(
          "/api/v1/customer/coupon/my/available"
        );
        setCoupons(res.data || []);
      } catch (err) {
        console.error("[Coupon/WebView] fetchMyCoupons error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCoupons();
  }, [isAuth]);

  /** 쿠폰 재다운로드 (또는 발급) */
  const handleDownload = useCallback(async (couponId: number) => {
    try {
      const res = await api.post<UserCoupon>(
        `/api/v1/customer/coupon/${couponId}/download`
      );
      if (!res.data) return;

      setCoupons((prev) => {
        const idx = prev.findIndex(
          (c) => c.userCouponId === res.data.userCouponId
        );
        if (idx === -1) return [...prev, res.data];
        const copy = [...prev];
        copy[idx] = res.data;
        return copy;
      });

      // TODO: 토스트 "쿠폰이 발급되었습니다."
    } catch (err) {
      console.error("[Coupon/WebView] handleDownload error:", err);
      // TODO: 토스트 에러 안내
    }
  }, []);

  /** 카테고리 + 정렬 적용 리스트 */
  const filtered = useMemo(() => {
    const list = coupons.filter((c) =>
      category === "전체" ? true : c.category === category
    );

    list.sort((a, b) => {
      const da = +new Date(a.downloadedAt || a.startDate);
      const db = +new Date(b.downloadedAt || b.startDate);
      return sort === "최신순" ? db - da : da - db;
    });

    return list;
  }, [coupons, category, sort]);

  return (
    <div className="w-full min-h-screen bg-[#F3F5F9]">
      <div className="mx-auto max-w-[960px] px-6 lg:px-8 pt-10 pb-24">
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
            filtered.map((c) => (
              <CouponCard
                key={c.userCouponId}
                c={c}
                onDownload={handleDownload}
              />
            ))
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

function CouponCard({
  c,
  onDownload,
}: {
  c: UserCoupon;
  onDownload: (couponId: number) => void;
}) {
  const period = `사용기간 : ${c.startDate} ~ ${c.expirationDate}`;
  const discountLabel =
    c.discountType === "PERCENT"
      ? `${c.discountValue}%`
      : `${c.discountValue.toLocaleString()}원`;

  return (
    <article className="relative overflow-hidden rounded-2xl bg-white border border-[#E6E9EF] shadow-sm px-6 py-5">
      {/* 오른쪽 은은한 스트립 */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[96px] bg-[#F6F7FB]" />

      {/* 상단: 타이틀 */}
      <div className="relative flex items-start gap-2 pr-[110px]">
        <Icon
          icon="solar:ticket-sale-linear"
          className="mt-1 w-5 h-5 text-[#6B7280]"
          aria-hidden
        />
        <h3 className="text-[16px] leading-[22px] font-medium tracking-[-0.2px] text-[#111827]">
          {c.couponName}
        </h3>
      </div>

      {/* 본문: 할인값 / 설명 */}
      <div className="relative mt-2 pr-[110px]">
        <div className="text-[22px] leading-[32px] font-bold tracking-[-0.2px] text-[#111827]">
          {discountLabel}
        </div>
        <div className="mt-2 space-y-1 text-[13px] leading-[18px] tracking-[-0.1px] text-[#6B7280]">
          <p className="line-clamp-1">{c.couponDetail}</p>
          <p>{period}</p>
        </div>
      </div>

      {/* 다운로드 / 재발급 버튼 */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2">
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-white shadow-md ring-1 ring-black/5 flex items-center justify-center hover:translate-y-[-1px] transition-transform disabled:opacity-40"
          aria-label="쿠폰 다운로드"
          onClick={() => onDownload(c.couponId)}
          disabled={!c.canUse}
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
