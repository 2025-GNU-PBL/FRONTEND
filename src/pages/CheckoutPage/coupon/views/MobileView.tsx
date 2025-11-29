import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../../lib/api/axios";

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

// API 응답 구조에 맞춘 Coupon 타입
interface Coupon {
  userCouponId: number;
  status: string;
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

// 금액을 "10만원" / "10,500원" 이런 식으로 예쁘게 포맷
const formatKoreanMoney = (amount: number): string => {
  if (!amount || amount <= 0) return "0원";

  if (amount % 10000 === 0) {
    // 딱 떨어지면 "10만원"
    return `${amount / 10000}만원`;
  }

  // 애매한 값이면 그냥 "10,500원"
  return `${amount.toLocaleString("ko-KR")}원`;
};

const MobileView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CouponCategory>("전체");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [applicableCouponIds, setApplicableCouponIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedUserCouponId, setSelectedUserCouponId] = useState<
    number | null
  >(null); // ✅ 기본: 선택 없음

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { products = [], purchaseAmount } =
    (location.state as CouponPageState) || {};

  // 기준 상품: 결제 순서상 맨 위 상품 기준
  const currentProduct = useMemo(
    () => (products.length > 0 ? products[0] : undefined),
    [products]
  );

  // ✅ 기준 금액: 현재 상품(lineTotal) 우선, 없으면 purchaseAmount
  const effectiveAmount = useMemo(() => {
    if (currentProduct) return currentProduct.lineTotal;
    if (purchaseAmount !== undefined) return purchaseAmount;
    return 0;
  }, [currentProduct, purchaseAmount]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) 내가 사용 가능한 쿠폰(보유 쿠폰) 전체
        const availableRes = await api.get<Coupon[]>(
          "/api/v1/customer/coupon/my/available"
        );
        const availableCoupons = availableRes.data ?? [];
        setCoupons(availableCoupons);

        // 2) 현재 상품/금액 기준으로 적용 가능한 쿠폰 조회
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

          // ✅ 자동 선택 제거: 선택 초기화
          setSelectedUserCouponId(null);
        } else {
          // 상품/금액 정보 없으면 일단 전부 적용 가능 처리
          const idSet = new Set<number>(
            availableCoupons.map((c) => c.userCouponId)
          );
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
  }, [currentProduct, effectiveAmount]);

  // UI 표기에 맞춰 category 변환
  const convertCategory = (key: string): string => {
    return categoryMap[key] ?? key;
  };

  // 할인율 또는 할인금액 포맷팅
  const formatRate = (coupon: Coupon) => {
    if (coupon.discountType === "RATE") {
      return `${coupon.discountValue}%`;
    }
    return `${coupon.discountValue.toLocaleString("ko-KR")}원`;
  };

  // ✅ 조건 텍스트 포맷팅
  // 예: "10만원 이상 구매 시 최대 1만원 할인"
  const formatCondition = (coupon: Coupon) => {
    const minText = formatKoreanMoney(coupon.minPurchaseAmount);

    // 퍼센트(비율) 쿠폰인 경우 → maxDiscountAmount 사용
    if (coupon.discountType === "RATE") {
      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        const maxText = formatKoreanMoney(coupon.maxDiscountAmount);
        return `${minText} 이상 구매 시 최대 ${maxText} 할인`;
      }
      // max 값이 없으면 그냥 "이상 구매 시 할인" 형태로만
      return `${minText} 이상 구매 시 할인`;
    }

    // 정액(FIXED) 쿠폰인 경우 → discountValue 사용
    const discountText = formatKoreanMoney(coupon.discountValue);
    return `${minText} 이상 구매 시 ${discountText} 할인`;
  };

  // 기간 텍스트 포맷팅 (YY.MM.DD 형태)
  const formatPeriod = (coupon: Coupon) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      const yyyy = dateStr.substring(2, 4);
      const mm = dateStr.substring(5, 7);
      const dd = dateStr.substring(8, 10);
      return `${yyyy}.${mm}.${dd}`;
    };

    const start = formatDate(coupon.startDate);
    const end = formatDate(coupon.expirationDate);

    return `사용기간 : ${start}~${end}`;
  };

  const filteredCoupons =
    activeCategory === "전체"
      ? coupons
      : coupons.filter((c) => convertCategory(c.category) === activeCategory);

  // 적용 가능한 쿠폰 개수
  const applicableCount = useMemo(
    () => coupons.filter((c) => applicableCouponIds.has(c.userCouponId)).length,
    [coupons, applicableCouponIds]
  );

  // 선택된 쿠폰
  const selectedCoupon = useMemo(
    () => coupons.find((c) => c.userCouponId === selectedUserCouponId) ?? null,
    [coupons, selectedUserCouponId]
  );

  // 선택된 쿠폰 기준 할인 금액
  const selectedDiscountAmount = useMemo(() => {
    if (!selectedCoupon || effectiveAmount <= 0) return 0;

    let discount = 0;

    if (selectedCoupon.discountType === "RATE") {
      discount = Math.floor(
        (effectiveAmount * selectedCoupon.discountValue) / 100
      );
      if (
        selectedCoupon.maxDiscountAmount &&
        selectedCoupon.maxDiscountAmount > 0
      ) {
        discount = Math.min(discount, selectedCoupon.maxDiscountAmount);
      }
    } else {
      discount = selectedCoupon.discountValue;
    }

    if (discount > effectiveAmount) discount = effectiveAmount;
    return discount;
  }, [selectedCoupon, effectiveAmount]);

  // 쿠폰 카드 클릭: 적용 가능할 때만 단일 선택/해제
  const handleSelectCoupon = (coupon: Coupon, isApplicable: boolean) => {
    if (!isApplicable) return;
    setSelectedUserCouponId((prev) =>
      prev === coupon.userCouponId ? null : coupon.userCouponId
    );
  };

  // ✅ "적용하기" 버튼: /use 호출 X, 선택 정보만 /checkout 으로 전달
  const handleApplyCoupon = () => {
    if (
      !selectedCoupon ||
      !selectedUserCouponId ||
      selectedDiscountAmount <= 0
    ) {
      // 선택 안 했으면 쿠폰 미적용 상태로 결제 페이지로 복귀
      navigate("/checkout");
      return;
    }

    navigate("/checkout", {
      state: {
        selectedCouponId: selectedCoupon.userCouponId, // ✅ userCouponId 전달
        selectedCoupon,
        discountAmount: selectedDiscountAmount,
        productId: currentProduct?.productId,
        appliedAmount: effectiveAmount,
        applicableCount,
      },
    });
  };

  return (
    // 🔹 전체 화면 기준 반응형 레이아웃
    <div className="relative flex min-h-screen w-full bg-[#F5F5F5]">
      {/* 내부 컨테이너: 전체 폭 사용 */}
      <div className="flex min-h-screen w-full flex-col bg-white overflow-hidden">
        {/* 헤더 (고정 영역 상단) */}
        <header className="relative flex h-[60px] items-center justify-between px-5 shrink-0">
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

          <div className="absolute left-1/2 -translate-x-1/2 text-center text-[18px] font-semibold text-[#1E2124]">
            쿠폰 선택
          </div>

          <div className="h-6 w-6" />
        </header>

        {/* 상단 개수 + 카테고리 탭 (고정 영역) */}
        <section className="px-5 pt-5 shrink-0">
          <div className="flex w-full flex-col gap-4">
            {/* 상단 개수 */}
            <div className="flex h-[21px] items-center justify-between">
              <span className="text-[14px]">
                {`상품 쿠폰 ${coupons.length}장`}
              </span>
              <span className="text-[14px] text-[#999999]">
                {`적용 가능 ${applicableCount}장`}
              </span>
            </div>

            {/* 카테고리 탭 - 가운데 정렬 */}
            <div className="flex justify-center">
              <div className="flex h-[37px] flex-nowrap gap-2">
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
            </div>
          </div>
        </section>

        {/* 🔹 쿠폰 리스트 스크롤 영역 (중앙만 스크롤) */}
        <main className="scrollbar-hide flex-1 overflow-y-auto px-5 pt-5 pb-4">
          <div className="w-full">
            {loading ? (
              <div className="text-[13px] text-[#999999]">
                쿠폰을 불러오는 중입니다...
              </div>
            ) : error ? (
              <div className="text-[13px] text-[#EF4444]">{error}</div>
            ) : filteredCoupons.length === 0 ? (
              <div className="mt-4 text-center text-[13px] text-[#999999]">
                적용 가능한 쿠폰이 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-4 pb-4">
                {filteredCoupons.map((coupon, index) => {
                  const isApplicable = applicableCouponIds.has(
                    coupon.userCouponId
                  );
                  const isSelected =
                    selectedUserCouponId === coupon.userCouponId;

                  return (
                    <div
                      key={`${coupon.userCouponId}-${index}`}
                      className="flex h-[129px] w-full cursor-pointer flex-row items-center"
                      onClick={() => handleSelectCoupon(coupon, isApplicable)}
                    >
                      {/* 왼쪽 영역 */}
                      <div
                        className={`flex h-[129px] flex-1 flex-col items-start gap-[10px] border border-[#F2F2F2] border-r-0 p-4 rounded-l-[16px] ${
                          !isApplicable ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex h-[97px] w-full flex-col items-start gap-1">
                          <p className="w-full truncate text-[14px] text-[#000000]">
                            {coupon.couponName}
                          </p>

                          <p className="text-[20px] font-[700] text-[#000000]">
                            {formatRate(coupon)}
                          </p>
                        </div>

                        <div className="flex w-full flex-col items-start">
                          <p className="text-[12px] text-[#999999]">
                            {formatCondition(coupon)}
                          </p>
                          <p className="text-[12px] text-[#999999]">
                            {formatPeriod(coupon)}
                          </p>
                        </div>
                      </div>

                      {/* 오른쪽 선택/불가 영역 */}
                      <div className="flex h-[129px] w-[72px] flex-row items-center bg-[#F6F7FB] px-[18px] border border-[#F2F2F2] border-l-0 rounded-r-[16px]">
                        {isApplicable ? (
                          <div
                            className={`flex h-[36px] w-[36px] items-center justify-center rounded-[20px] ${
                              isSelected ? "bg-[#000000]" : "bg-[#FFFFFF]"
                            }`}
                          >
                            {isSelected ? (
                              <Icon
                                icon="mdi:check"
                                className="h-4 w-4 text-[#FFFFFF]"
                              />
                            ) : (
                              <div className="h-[10px] w-[10px] rounded-full border border-[#000000]" />
                            )}
                          </div>
                        ) : (
                          <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[20px] bg-[#F0F0F0]">
                            <span className="text-[10px] leading-none text-[#BDBDBD]">
                              불가
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* 🔹 하단 적용 버튼 (푸터처럼 고정) */}
        <div className="shrink-0 border-t border-[#F2F2F2] bg-white px-5 pb-5 pt-3">
          <div className="w-full">
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="flex h-[56px] w-full items-center justify-center rounded-[12px] bg-[#FF2233] disabled:bg-[#F3F4F6]"
              disabled={!selectedCoupon || selectedDiscountAmount <= 0}
            >
              <span className="text-[16px] font-[600] text-white">
                {selectedCoupon && selectedDiscountAmount > 0
                  ? `${selectedDiscountAmount.toLocaleString(
                      "ko-KR"
                    )}원 적용하기`
                  : "적용 가능한 쿠폰이 없습니다"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
