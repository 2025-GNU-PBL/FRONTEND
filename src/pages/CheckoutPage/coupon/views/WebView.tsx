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

const CATEGORY_LABELS: CouponCategory[] = [
  "전체",
  "웨딩홀",
  "스튜디오",
  "드레스",
  "메이크업",
];

// API 응답 구조에 맞춘 Coupon 타입 (모바일과 동일)
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

// /checkout → /checkout/coupon 올 때 넘겨주는 state
interface CouponPageState {
  products?: ProductForCoupon[];
  purchaseAmount?: number;
}

const WebView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { products = [], purchaseAmount } =
    (location.state as CouponPageState) || {};

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

  // 기준 상품: 결제 순서상 맨 위 상품 기준
  const currentProduct = useMemo(
    () => (products.length > 0 ? products[0] : undefined),
    [products]
  );

  // 기준 금액: purchaseAmount(전체 금액) 우선, 없으면 현재 상품 lineTotal
  const effectiveAmount = useMemo(() => {
    if (purchaseAmount !== undefined) return purchaseAmount;
    if (currentProduct) return currentProduct.lineTotal;
    return 0;
  }, [purchaseAmount, currentProduct]);

  // 쿠폰 조회 (모바일 로직 그대로)
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

          // ✅ 자동 선택 제거
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

  // 조건 텍스트 포맷팅
  const formatCondition = (coupon: Coupon) => {
    return `최소 ${coupon.minPurchaseAmount.toLocaleString(
      "ko-KR"
    )}원 이상 구매 시`;
  };

  // 기간 텍스트 포맷팅
  const formatPeriod = (coupon: Coupon) => {
    return `${coupon.startDate} ~ ${coupon.expirationDate}`;
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

  // 선택된 쿠폰 기준 할인 금액 (모바일과 동일)
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

  const handleSkipCoupon = () => {
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 헤더 */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900">
              <Icon icon="mdi:ticket-percent" className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">쿠폰함</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                결제할 상품에 사용할 수 있는 쿠폰을 한눈에 확인해 보세요.
              </p>
            </div>
          </div>

          <div className="hidden text-right text-xs text-slate-500 sm:flex sm:flex-col sm:items-end sm:gap-1">
            <span>
              보유 쿠폰{" "}
              <span className="font-semibold text-slate-900">
                {coupons.length}
              </span>
              장
            </span>
            <span>
              적용 가능{" "}
              <span className="font-semibold text-emerald-600">
                {applicableCount}
              </span>
              장
            </span>
          </div>
        </div>
      </header>

      {/* 메인 레이아웃 */}
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-6 lg:flex-row">
        {/* 메인 콘텐츠: 카테고리 + 쿠폰 리스트 */}
        <section className="flex-1 space-y-4">
          {/* 상단 카테고리 탭 + 정보 */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {CATEGORY_LABELS.map((label) => {
                  const key = label as CouponCategory;
                  const isActive = activeCategory === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveCategory(key)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Icon
                    icon="mdi:ticket-confirmation"
                    className="h-3.5 w-3.5"
                  />
                  <span>
                    전체{" "}
                    <span className="font-semibold text-slate-900">
                      {coupons.length}
                    </span>
                    장
                  </span>
                </div>
                <span className="h-3 w-px bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <Icon icon="mdi:check-circle" className="h-3.5 w-3.5" />
                  <span>
                    적용 가능{" "}
                    <span className="font-semibold text-emerald-600">
                      {applicableCount}
                    </span>
                    장
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              <Icon icon="mdi:information-outline" className="h-3.5 w-3.5" />
              <span className="line-clamp-1">
                현재 결제 금액 기준으로 적용 가능한 쿠폰만 선택할 수 있어요.
              </span>
            </div>
          </div>

          {/* 리스트/로딩/에러 */}
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-400">
              <Icon icon="mdi:loading" className="mb-3 h-6 w-6 animate-spin" />
              <p className="text-sm font-medium">쿠폰을 불러오는 중입니다</p>
              <p className="mt-1 text-xs text-slate-400">
                잠시만 기다려 주세요.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center text-red-500 text-sm">
              <Icon icon="mdi:alert-circle-outline" className="mb-3 h-7 w-7" />
              {error}
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-400">
              <Icon
                icon="mdi:ticket-percent-outline"
                className="mb-4 h-12 w-12"
              />
              <p className="text-sm font-medium">
                선택한 카테고리에 사용할 수 있는 쿠폰이 없습니다.
              </p>
              <p className="mt-1 text-xs">
                다른 카테고리를 선택하거나, 새로운 쿠폰이 발급될 때까지 기다려
                주세요.
              </p>
            </div>
          ) : (
            <>
              {/* 쿠폰 그리드 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredCoupons.map((coupon) => {
                  const isApplicable = applicableCouponIds.has(
                    coupon.userCouponId
                  );
                  const isSelected =
                    selectedUserCouponId === coupon.userCouponId;

                  return (
                    <article
                      key={coupon.userCouponId}
                      className={`relative cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                        isSelected
                          ? "border-slate-900 shadow-md"
                          : "border-slate-200 hover:-translate-y-0.5 hover:shadow-md"
                      } ${!isApplicable ? "opacity-70" : ""}`}
                      onClick={() => handleSelectCoupon(coupon, isApplicable)}
                    >
                      {/* 왼쪽 컬러 바: 적용 가능 여부 기준 */}
                      <div
                        className={`absolute inset-y-0 left-0 w-1 ${
                          isApplicable ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />

                      {/* 상단 상태 뱃지 */}
                      <div className="absolute right-3 top-3 flex items-center gap-2">
                        {!isApplicable && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            <Icon
                              icon="mdi:close-circle-outline"
                              className="h-3 w-3"
                            />
                            조건 미충족
                          </span>
                        )}
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
                            <Icon
                              icon="mdi:check-bold"
                              className="h-3 w-3 text-white"
                            />
                            선택됨
                          </span>
                        )}
                      </div>

                      <div className="p-4 pl-5 pr-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            {/* 쿠폰명 + 할인 텍스트 */}
                            <p className="text-[13px] font-medium text-slate-900 line-clamp-2">
                              {coupon.couponName}
                            </p>
                            <p className="text-[20px] font-bold text-slate-900">
                              {formatRate(coupon)}
                            </p>
                          </div>

                          {/* 선택 상태 표시 라디오 */}
                          <div className="flex items-center justify-center">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                                isSelected
                                  ? "border-slate-900 bg-slate-900"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected ? (
                                <Icon
                                  icon="mdi:check"
                                  className="h-4 w-4 text-white"
                                />
                              ) : (
                                <div className="h-2.5 w-2.5 rounded-full border border-slate-700" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 상세 설명 */}
                        {coupon.couponDetail && (
                          <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                            {coupon.couponDetail}
                          </p>
                        )}

                        <div className="mt-3 flex items-end justify-between text-[11px] text-slate-500">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <Icon
                                icon="mdi:cash-multiple"
                                className="h-3.5 w-3.5"
                              />
                              <span>{formatCondition(coupon)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Icon
                                icon="mdi:calendar-range"
                                className="h-3.5 w-3.5"
                              />
                              <span>{formatPeriod(coupon)}</span>
                            </div>
                          </div>

                          {/* 카테고리/만료정보 간단 뱃지 */}
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                              <Icon
                                icon="mdi:storefront-outline"
                                className="h-3.5 w-3.5"
                              />
                              <span>
                                {coupon.category
                                  ? convertCategory(coupon.category)
                                  : "전체"}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                              <Icon
                                icon="mdi:clock-outline"
                                className="h-3.5 w-3.5"
                              />
                              <span>
                                {coupon.daysUntilExpiration >= 0
                                  ? `D-${coupon.daysUntilExpiration}`
                                  : "만료됨"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* 하단 적용 버튼 */}
              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleSkipCoupon}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Icon
                    icon="mdi:close"
                    className="mr-1.5 h-4 w-4 text-slate-400"
                  />
                  쿠폰 사용 안함
                </button>

                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!selectedCoupon || selectedDiscountAmount <= 0}
                  className={`inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                    selectedCoupon && selectedDiscountAmount > 0
                      ? "bg-[#FF2233] text-white shadow-[0_10px_20px_rgba(255,34,51,0.35)] hover:brightness-105 active:scale-95"
                      : "cursor-not-allowed bg-slate-200 text-slate-500"
                  }`}
                >
                  {selectedCoupon && selectedDiscountAmount > 0
                    ? `${selectedDiscountAmount.toLocaleString(
                        "ko-KR"
                      )}원 적용하기`
                    : "선택된 쿠폰이 없습니다"}
                </button>
              </div>
            </>
          )}
        </section>

        {/* 오른쪽: 요약 / 결제 정보 패널 */}
        <aside className="w-full space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:w-72 lg:self-start lg:sticky lg:top-24">
          {/* 현재 결제 정보 */}
          <div>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Icon icon="mdi:cart-outline" className="h-4 w-4" />
              결제 정보
            </h2>
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-700">
              {currentProduct ? (
                <>
                  <p className="font-medium text-slate-900 line-clamp-2">
                    {currentProduct.productName}
                  </p>
                  {currentProduct.shopName && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {currentProduct.shopName}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">결제 예정 금액</span>
                    <span className="font-semibold text-slate-900">
                      {effectiveAmount.toLocaleString("ko-KR")}원
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500">
                  결제 예정 상품 정보가 없습니다. 전체 금액 기준으로 쿠폰을
                  확인합니다.
                </p>
              )}
            </div>
          </div>

          {/* 선택된 쿠폰 요약 */}
          <div>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Icon icon="mdi:ticket-outline" className="h-4 w-4" />
              선택된 쿠폰
            </h2>
            <div className="space-y-2 rounded-xl bg-slate-50 px-3 py-3 text-xs">
              {selectedCoupon && selectedDiscountAmount > 0 ? (
                <>
                  <p className="font-medium text-slate-900 line-clamp-2">
                    {selectedCoupon.couponName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {selectedCoupon.couponDetail}
                  </p>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">할인 금액</span>
                      <span className="font-semibold text-rose-600">
                        -{selectedDiscountAmount.toLocaleString("ko-KR")}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">적용 후 예상 결제</span>
                      <span className="font-semibold text-slate-900">
                        {(
                          effectiveAmount - selectedDiscountAmount
                        ).toLocaleString("ko-KR")}
                        원
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <Icon icon="mdi:ticket-percent-outline" className="h-4 w-4" />
                  <span className="text-[11px]">
                    아직 선택된 쿠폰이 없습니다.
                    <br />
                    목록에서 사용할 쿠폰을 선택해 주세요.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 안내 문구 */}
          <div>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Icon icon="mdi:information-outline" className="h-4 w-4" />
              이용 안내
            </h2>
            <ul className="space-y-1.5 text-[11px] text-slate-500">
              <li>• 결제 1회당 1개의 쿠폰만 사용할 수 있습니다.</li>
              <li>• 쿠폰별 최소 결제 금액 및 카테고리를 확인해 주세요.</li>
              <li>• 사용 기한이 지난 쿠폰은 자동으로 숨겨질 수 있습니다.</li>
              <li>• 일부 상품에는 쿠폰이 적용되지 않을 수 있습니다.</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default WebView;
