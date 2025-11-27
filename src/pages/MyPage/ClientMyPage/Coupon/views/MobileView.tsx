// src/pages/MyPage/ClientMyPage/Coupons/MobileView.tsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../../../lib/api/axios";
import { useAppSelector } from "../../../../../store/hooks";

const categoryMap: Record<string, string> = {
  WEDDING_HALL: "웨딩홀",
  STUDIO: "스튜디오",
  DRESS: "드레스",
  MAKEUP: "메이크업",
};

type CouponCategory =
  | "전체"
  | "웨딩홀"
  | "스튜디오"
  | "드레스"
  | "메이크업"
  | string;

type SortOption = "최신순" | "오래된순";

interface Coupon {
  userCouponId: number;
  status: "AVAILABLE" | "USED" | "EXPIRED" | "CANCELLED" | string;
  downloadedAt: string;
  usedAt: string | null;
  couponId: number;
  couponCode: string;
  couponName: string;
  couponDetail: string;
  discountType: "RATE" | "FIXED" | string;
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;
  startDate: string;
  expirationDate: string;
  category: string;
  canUse: boolean;
  daysUntilExpiration: number;
  productId: number | null;
  productName: string | null;
}

interface ProductForCoupon {
  productId: number;
  productName: string;
  lineTotal: number;
  shopName: string | null;
}

interface CouponPageState {
  products?: ProductForCoupon[];
  purchaseAmount?: number;
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")}`;
};

const MobileView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CouponCategory>("전체");
  const [sort, setSort] = useState<SortOption>("최신순");
  const [sortOpen, setSortOpen] = useState(false);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [applicableCouponIds, setApplicableCouponIds] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { products = [], purchaseAmount } =
    (location.state as CouponPageState) || {};

  const isAuth = useAppSelector((s) => s.user.isAuth);

  const currentProduct = useMemo(
    () => (products.length > 0 ? products[0] : undefined),
    [products]
  );

  const effectiveAmount = useMemo(() => {
    if (currentProduct) return currentProduct.lineTotal;
    if (purchaseAmount !== undefined) return purchaseAmount;
    return 0;
  }, [currentProduct, purchaseAmount]);

  // ⭐ 스크롤 여부 감지용 Ref & State
  const categoryRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  // 정렬 드롭다운 바깥 클릭 감지용 ref
  const sortRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkScrollable = () => {
      if (!categoryRef.current) return;
      const { scrollWidth, clientWidth } = categoryRef.current;
      setIsScrollable(scrollWidth > clientWidth);
    };

    checkScrollable();
    window.addEventListener("resize", checkScrollable);
    return () => window.removeEventListener("resize", checkScrollable);
  }, []);

  // 정렬 드롭다운 바깥 클릭 시 닫기
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

  useEffect(() => {
    if (!isAuth) {
      setCoupons([]);
      setApplicableCouponIds(new Set());
      return;
    }

    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setError(null);

        const allRes = await api.get<Coupon[]>("/api/v1/customer/coupon/my");
        const allCoupons = allRes.data ?? [];
        setCoupons(allCoupons);

        if (currentProduct && effectiveAmount > 0) {
          const applicableRes = await api.get<Coupon[]>(
            "/api/v1/customer/coupon/my/applicable",
            {
              params: {
                productId: currentProduct.productId,
                purchaseAmount: effectiveAmount,
              },
            }
          );

          const idSet = new Set<number>(
            (applicableRes.data ?? []).map((c) => c.userCouponId)
          );
          setApplicableCouponIds(idSet);
        } else {
          setApplicableCouponIds(
            new Set(allCoupons.map((c) => c.userCouponId))
          );
        }
      } catch (e) {
        console.error(e);
        setError("쿠폰 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [isAuth, currentProduct, effectiveAmount]);

  const filteredCoupons =
    activeCategory === "전체"
      ? coupons
      : coupons.filter(
          (c) => (categoryMap[c.category] ?? c.category) === activeCategory
        );

  const sortedCoupons = useMemo(() => {
    return [...filteredCoupons].sort((a, b) => {
      // 1순위: 사용 가능 여부 (applicable)
      const aApp = applicableCouponIds.has(a.userCouponId);
      const bApp = applicableCouponIds.has(b.userCouponId);
      if (aApp !== bApp) return aApp ? -1 : 1;

      // 2순위: 사용 여부
      const aUsed = a.status === "USED";
      const bUsed = b.status === "USED";
      if (aUsed !== bUsed) return aUsed ? 1 : -1;

      // 3순위: 다운로드/시작 날짜 기준 정렬 (최신순 / 오래된순)
      const aDate = +new Date(a.downloadedAt || a.startDate);
      const bDate = +new Date(b.downloadedAt || b.startDate);

      if (sort === "최신순") {
        return bDate - aDate; // 최신순
      }
      return aDate - bDate; // 오래된순
    });
  }, [filteredCoupons, applicableCouponIds, sort]);

  return (
    <div className="w-full min-h-screen bg-[#F5F5F5] flex flex-col">
      <div className="w-full bg-white min-h-screen">
        <div className="sticky top-0 z-20 bg-white">
          <header className="relative flex h-[60px] items-center justify-between px-5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-6 w-6 items-center justify-center"
            >
              <Icon
                icon="solar:alt-arrow-left-linear"
                className="h-6 w-6 text-[#1E2124]"
              />
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 text-[18px] font-semibold">
              쿠폰함
            </div>

            <div className="h-6 w-6" />
          </header>

          <section className="px-5 pt-5 pb-3">
            <div className="w-full mx-auto flex flex-col gap-4">
              {/* ⭐ 변경된 카테고리 버튼 래퍼 */}
              <div
                ref={categoryRef}
                className={`flex gap-2 overflow-x-auto scrollbar-hide w-full ${
                  isScrollable
                    ? "flex-nowrap justify-start"
                    : "flex-nowrap justify-center"
                }`}
              >
                {["전체", "웨딩홀", "스튜디오", "드레스", "메이크업"].map(
                  (label) => {
                    const key = label as CouponCategory;
                    const active = activeCategory === key;

                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setActiveCategory(key)}
                        className={`px-3 py-2 rounded-[20px] text-[14px] border whitespace-nowrap ${
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white text-black border-[#D9D9D9]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  }
                )}
              </div>

              {/* 보유 쿠폰 + 정렬 드롭다운 */}
              <div className="flex items-center justify-between">
                <span className="text-[14px]">
                  보유 쿠폰 {sortedCoupons.length}
                </span>

                <div className="relative" ref={sortRef}>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[13px]"
                    onClick={() => setSortOpen((prev) => !prev)}
                  >
                    {sort}
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      className="w-4 h-4 text-[#9CA3AF]"
                    />
                  </button>

                  {sortOpen && (
                    <div className="absolute right-0 mt-1 w-[120px] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-30">
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2.5 text-[13px] ${
                          sort === "최신순"
                            ? "bg-gray-100 font-semibold"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setSort("최신순");
                          setSortOpen(false);
                        }}
                      >
                        최신순
                      </button>
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2.5 text-[13px] ${
                          sort === "오래된순"
                            ? "bg-gray-100 font-semibold"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setSort("오래된순");
                          setSortOpen(false);
                        }}
                      >
                        오래된순
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <main className="px-5 pb-[96px] pt-2">
          <div className="w-full mx-auto">
            {loading ? (
              <div className="text-[13px] text-[#999]">
                쿠폰을 불러오는 중입니다...
              </div>
            ) : error ? (
              <div className="text-[13px] text-[#EF4444]">{error}</div>
            ) : sortedCoupons.length === 0 ? (
              <div className="text-[13px] text-[#999]">
                보유중인 쿠폰이 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sortedCoupons.map((coupon, idx) => {
                  const isApplicable = applicableCouponIds.has(
                    coupon.userCouponId
                  );
                  const isUsed = coupon.status === "USED";

                  const isRate = coupon.discountType === "RATE";
                  const discountText = isRate
                    ? `${coupon.discountValue}% 할인`
                    : `${coupon.discountValue.toLocaleString()}원 할인`;

                  const line1 =
                    coupon.minPurchaseAmount > 0
                      ? `${coupon.minPurchaseAmount.toLocaleString()}원 이상 구매 시${
                          coupon.maxDiscountAmount > 0
                            ? ` 최대 ${coupon.maxDiscountAmount.toLocaleString()}원`
                            : ""
                        }`
                      : coupon.couponDetail;

                  const line2 = `사용기간 : ${formatDate(
                    coupon.startDate
                  )} ~ ${formatDate(coupon.expirationDate)}`;

                  let status = "";
                  let circleBg = "";
                  let icon = "";
                  let iconColor = "";
                  let textColor = "";

                  if (isUsed) {
                    status = "사용됨";
                    circleBg = "bg-[#F3F4F6]";
                    icon = "mdi:check-all";
                    iconColor = "text-[#6B7280]";
                    textColor = "text-[#6B7280]";
                  } else if (isApplicable) {
                    status = "사용 가능";
                    circleBg = "bg-[#ECFDF3]";
                    icon = "mdi:check-circle-outline";
                    iconColor = "text-[#16A34A]";
                    textColor = "text-[#16A34A]";
                  } else {
                    status = "사용 불가";
                    circleBg = "bg-[#F3F4F6]";
                    icon = "mdi:close-circle-outline";
                    iconColor = "text-[#9CA3AF]";
                    textColor = "text-[#9CA3AF]";
                  }

                  return (
                    <div
                      key={idx}
                      className="w-full flex rounded-[16px] border border-[#F2F2F2] overflow-hidden"
                    >
                      <div
                        className={`flex flex-col flex-1 min-w-0 p-4 gap-1 ${
                          !isApplicable ? "opacity-50" : ""
                        }`}
                      >
                        <p className="text-[14px] font-medium truncate">
                          {coupon.couponName}
                        </p>

                        <p className="text-[20px] font-bold">{discountText}</p>

                        <p className="text-[12px] text-[#999] truncate">
                          {line1}
                        </p>

                        <p className="text-[12px] text-[#999] -mt-1">{line2}</p>
                      </div>

                      <div className="w-[72px] bg-[#F6F7FB] flex flex-col items-center justify-center gap-2 border-l border-[#F2F2F2]">
                        <div
                          className={`w-[36px] h-[36px] rounded-full flex items-center justify-center ${circleBg}`}
                        >
                          <Icon
                            icon={icon}
                            className={`w-5 h-5 ${iconColor}`}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-medium ${textColor}`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MobileView;
