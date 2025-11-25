// src/pages/MyPage/ClientMyPage/Coupons/MobileView.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../../../lib/api/axios";
import { useAppSelector } from "../../../../../store/hooks";

// API에서 내려오는 category를 UI 표기로 매핑
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

// 웹뷰와 동일한 Coupon 타입
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

const MobileView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CouponCategory>("전체");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [applicableCouponIds, setApplicableCouponIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedUserCouponId, setSelectedUserCouponId] = useState<
    number | null
  >(null);

  const [loading, setLoading] = useState<boolean>(false);
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

  useEffect(() => {
    if (!isAuth) {
      setCoupons([]);
      setApplicableCouponIds(new Set());
      setSelectedUserCouponId(null);
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

          const applicableList = applicableRes.data ?? [];
          const idSet = new Set<number>(
            applicableList.map((c) => c.userCouponId)
          );
          setApplicableCouponIds(idSet);
          setSelectedUserCouponId(null);
        } else {
          const idSet = new Set<number>(allCoupons.map((c) => c.userCouponId));
          setApplicableCouponIds(idSet);
          setSelectedUserCouponId(null);
        }
      } catch (err) {
        console.error(err);
        setError("쿠폰 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [isAuth, currentProduct, effectiveAmount]);

  const convertCategory = (key: string): string => {
    return categoryMap[key] ?? key;
  };

  const formatRate = (coupon: Coupon) => {
    if (coupon.discountType === "RATE") {
      return `${coupon.discountValue}%`;
    }
    return `${coupon.discountValue.toLocaleString("ko-KR")}원`;
  };

  const formatCondition = (coupon: Coupon) => {
    return `최소 ${coupon.minPurchaseAmount.toLocaleString(
      "ko-KR"
    )}원 이상 구매 시`;
  };

  const formatPeriod = (coupon: Coupon) => {
    return `${coupon.startDate} ~ ${coupon.expirationDate}`;
  };

  const filteredCoupons =
    activeCategory === "전체"
      ? coupons
      : coupons.filter((c) => convertCategory(c.category) === activeCategory);

  /**
   * 정렬
   * 1) 사용 가능 > 사용 불가 > 사용됨
   * 2) 같은 그룹 내 최신순 (다운로드일자 기준)
   */
  const sortedCoupons = useMemo(() => {
    return [...filteredCoupons].sort((a, b) => {
      const aApplicable = applicableCouponIds.has(a.userCouponId);
      const bApplicable = applicableCouponIds.has(b.userCouponId);

      const aUsed = a.status === "USED";
      const bUsed = b.status === "USED";

      // 1) 사용 가능 먼저
      if (aApplicable && !bApplicable) return -1;
      if (!aApplicable && bApplicable) return 1;

      // 2) 사용됨은 아래로
      if (aUsed && !bUsed) return 1;
      if (!aUsed && bUsed) return -1;

      // 3) 최신순
      const da = +new Date(a.downloadedAt || a.startDate);
      const db = +new Date(b.downloadedAt || b.startDate);
      return db - da;
    });
  }, [filteredCoupons, applicableCouponIds]);

  const handleSelectCoupon = (coupon: Coupon, isApplicable: boolean) => {
    if (!isApplicable) return;
    setSelectedUserCouponId((prev) =>
      prev === coupon.userCouponId ? null : coupon.userCouponId
    );
  };

  return (
    <div className="min-h-screen flex justify-center bg-[#F5F5F5]">
      {/* 폰 화면 프레임 */}
      <div className="relative w-full max-w-[390px] min-h-screen bg-white">
        {/* sticky header */}
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

            <div className="absolute left-1/2 -translate-x-1/2 text-[18px] font-semibold text-[#1E2124]">
              쿠폰함
            </div>
            <div className="h-6 w-6" />
          </header>

          <section className="px-5 pt-5 pb-3">
            <div className="w-full max-w-[350px] mx-auto flex flex-col gap-4">
              {/* ✅ 원래 쓰던 카테고리 토글 디자인 그대로 복구 */}
              <div className="flex gap-2 h-[37px] flex-nowrap">
                {["전체", "웨딩홀", "스튜디오", "드레스", "메이크업"].map(
                  (label) => {
                    const key = label as CouponCategory;
                    const isActive = activeCategory === key;

                    const baseClass =
                      "px-3 py-2 rounded-[20px] h-[37px] text-[14px] whitespace-nowrap";
                    const activeClass =
                      "bg-[#000000] text-[#FEFFFF] border border-[#000000]";
                    const inactiveClass =
                      "bg-[#FEFFFF] text-[#000000] border border-[#D9D9D9]";

                    return (
                      <button
                        key={key}
                        type="button"
                        className={`${baseClass} ${
                          isActive ? activeClass : inactiveClass
                        }`}
                        onClick={() => setActiveCategory(key)}
                      >
                        {label}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="flex items-center justify-between h-[21px]">
                <span className="text-[14px]">
                  {`보유 쿠폰 ${sortedCoupons.length}`}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* 리스트 */}
        <main className="px-5 pb-[96px] pt-2">
          <div className="w-full max-w-[350px] mx-auto">
            {loading ? (
              <div className="text-[13px] text-[#999999]">
                쿠폰을 불러오는 중입니다...
              </div>
            ) : error ? (
              <div className="text-[13px] text-[#EF4444]">{error}</div>
            ) : sortedCoupons.length === 0 ? (
              <div className="text-[13px] text-[#999999]">
                보유중인 쿠폰이 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sortedCoupons.map((coupon, index) => {
                  const isApplicable = applicableCouponIds.has(
                    coupon.userCouponId
                  );
                  const isSelected =
                    selectedUserCouponId === coupon.userCouponId;
                  const isUsed = coupon.status === "USED";

                  let statusLabel = "";
                  let circleBgClass = "";
                  let iconName = "";
                  let iconColorClass = "";
                  let textColorClass = "";

                  if (isUsed) {
                    statusLabel = "사용됨";
                    circleBgClass = "bg-[#F3F4F6]";
                    iconName = "mdi:check-all";
                    iconColorClass = "text-[#6B7280]";
                    textColorClass = "text-[#6B7280]";
                  } else if (isApplicable) {
                    statusLabel = "사용 가능";
                    circleBgClass = "bg-[#ECFDF3]";
                    iconName = "mdi:check-circle-outline";
                    iconColorClass = "text-[#16A34A]";
                    textColorClass = "text-[#16A34A]";
                  } else {
                    statusLabel = "사용 불가";
                    circleBgClass = "bg-[#F3F4F6]";
                    iconName = "mdi:close-circle-outline";
                    iconColorClass = "text-[#9CA3AF]";
                    textColorClass = "text-[#9CA3AF]";
                  }

                  return (
                    <div
                      key={`${coupon.userCouponId}-${index}`}
                      className="flex flex-row items-center w-[350px] h-[129px] cursor-pointer"
                      onClick={() => handleSelectCoupon(coupon, isApplicable)}
                    >
                      {/* 왼쪽 */}
                      <div
                        className={`flex flex-col items-start p-4 gap-[10px] w-[278px] h-[129px] border border-r-0 rounded-l-[16px] ${
                          !isApplicable ? "opacity-50" : ""
                        } ${
                          isSelected ? "border-[#000000]" : "border-[#F2F2F2]"
                        }`}
                      >
                        <div className="flex flex-col gap-1 w-[222px]">
                          <p className="text-[14px] text-[#000000] truncate">
                            {coupon.couponName}
                          </p>
                          <p className="text-[20px] font-[700] text-[#000000]">
                            {formatRate(coupon)}
                          </p>
                        </div>

                        <div className="flex flex-col w-[220px]">
                          <p className="text-[12px] text-[#999999]">
                            {formatCondition(coupon)}
                          </p>
                          <p className="text-[12px] text-[#999999]">
                            {formatPeriod(coupon)}
                          </p>
                        </div>
                      </div>

                      {/* 오른쪽 상태 */}
                      <div
                        className={`flex flex-col items-center justify-center gap-2 px-[10px] w-[72px] h-[129px] bg-[#F6F7FB] border border-l-0 rounded-r-[16px] ${
                          isSelected ? "border-[#000000]" : "border-[#F2F2F2]"
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-[36px] h-[36px] rounded-full ${circleBgClass}`}
                        >
                          {isApplicable && isSelected ? (
                            <Icon
                              icon="mdi:check"
                              className="w-4 h-4 text-[#000000]"
                            />
                          ) : (
                            <Icon
                              icon={iconName}
                              className={`w-5 h-5 ${iconColorClass}`}
                            />
                          )}
                        </div>

                        <span
                          className={`text-[11px] font-medium ${textColorClass}`}
                        >
                          {statusLabel}
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
