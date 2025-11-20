import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../../lib/api/axios";

type OrderStatus = "WAITING_FOR_PAYMENT" | "PAID" | string;

interface OrderDetail {
  productId: number;
  productName: string;
  thumbnailUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface Order {
  orderId: number;
  orderCode: string;
  originalPrice: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  shopName: string | null;
  thumbnailUrl: string;
  appliedCustomerCouponId: number | null;
  orderDetails: OrderDetail[];
}

interface ProductForView extends OrderDetail {
  orderId: number;
  orderCode: string;
  shopName: string | null;
}

// 쿠폰 타입 (모바일과 동일 스펙)
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

// 쿠폰 페이지에서 되돌아올 때 받는 state 타입 (모바일과 동일)
interface CheckoutLocationState {
  selectedCouponId?: number | null; // == userCouponId
  selectedCoupon?: Coupon | null;
  discountAmount?: number; // 선택된 쿠폰 기준 할인액
  productId?: number;
  appliedAmount?: number;
  applicableCount?: number;
}

const WebView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const [applicableCouponCount, setApplicableCouponCount] =
    React.useState<number>(0);

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get<Order[]>("/api/v1/orders/my");
        // ✅ 결제 대기(WAITING_FOR_PAYMENT) 상태만 필터링
        const waitingOrders = res.data.filter(
          (order) => order.status === "WAITING_FOR_PAYMENT"
        );
        setOrders(waitingOrders);
      } catch (err) {
        console.error(err);
        setError("주문 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // 주문들에서 실제 화면에 보여줄 상품 리스트로 변환
  const products: ProductForView[] = React.useMemo(
    () =>
      orders.flatMap((order) =>
        order.orderDetails.map((detail) => ({
          ...detail,
          orderId: order.orderId,
          orderCode: order.orderCode,
          shopName: order.shopName,
        }))
      ),
    [orders]
  );

  // ✅ 우리 서비스 기준: 기본 할인 없음 → originalPrice만 신뢰
  const totalOriginalPrice = React.useMemo(
    () => orders.reduce((sum, order) => sum + order.originalPrice, 0),
    [orders]
  );

  const formatPrice = (value: number) => `${value.toLocaleString("ko-KR")}원`;

  // ✅ 쿠폰 페이지에서 돌아올 때 전달된 state
  const locationState = (location.state as CheckoutLocationState) || {};
  const selectedCoupon = locationState.selectedCoupon ?? null;
  const selectedCouponName = selectedCoupon?.couponName ?? null;
  const couponDiscountAmount = locationState.discountAmount ?? 0;
  const selectedCouponId = locationState.selectedCouponId ?? null;

  const displayApplicableCouponCount =
    locationState.applicableCount ?? applicableCouponCount;

  // ✅ 최종 결제 금액(쿠폰 할인만 반영) – 화면 표시용
  const finalDiscountAmount = couponDiscountAmount;
  const finalPayAmount = Math.max(totalOriginalPrice - couponDiscountAmount, 0);

  // ✅ 최초 진입 시, 맨 위 상품 + 전체 결제 금액 기준으로 사용 가능한 쿠폰 개수 조회
  React.useEffect(() => {
    const fetchApplicableCoupons = async () => {
      try {
        if (products.length === 0 || totalOriginalPrice <= 0) {
          setApplicableCouponCount(0);
          return;
        }

        const firstProduct = products[0];

        const res = await api.get<Coupon[]>(
          "/api/v1/customer/coupon/my/applicable",
          {
            params: {
              productId: firstProduct.productId,
              // ✅ 기본 할인 없음 → 원가 기준으로 쿠폰 가능 여부 체크
              purchaseAmount: totalOriginalPrice,
            },
          }
        );

        setApplicableCouponCount(res.data?.length ?? 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchApplicableCoupons();
  }, [products, totalOriginalPrice]);

  // ✅ 결제 버튼 클릭 시: 주문에 쿠폰 먼저 적용 → 그 다음 결제 페이지로 이동
  const handleClickPayment = async () => {
    if (orders.length === 0) {
      console.warn("[CHECKOUT_STEP2] 결제 가능한 주문이 없습니다.");
      return;
    }

    // 1순위: 결제 대기 주문 중 첫 번째
    const waitingOrder =
      orders.find((o) => o.status === "WAITING_FOR_PAYMENT") ?? orders[0];

    try {
      // 선택된 쿠폰이 있으면 주문에 쿠폰 적용 API 호출
      if (selectedCouponId) {
        await api.post(
          `/api/v1/orders/${waitingOrder.orderCode}/coupon/apply`,
          null,
          {
            params: {
              userCouponId: selectedCouponId,
            },
          }
        );
      }

      // ✅ orderCode + 쿠폰 정보 들고 결제 페이지로 이동
      navigate("/checkout/payment", {
        state: {
          orderCode: waitingOrder.orderCode,
          couponDiscountAmount,
          userCouponId: selectedCouponId ?? null,
        },
      });
    } catch (e) {
      console.error("[ORDER_COUPON_APPLY_ERROR]", e);
      alert("쿠폰 적용 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F6FA] font-['Pretendard'] text-[#1E2124]">
      {/* 네비게이션바 때문에 전체 여백 */}
      <div className="mx-auto pt-22 flex w-full max-w-6xl flex-col gap-6 px-6 pb-10">
        {/* 상단 헤더 영역 */}
        <header className="flex items-center justify-between rounded-2xl bg-white/90 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ECEFF3] bg-white transition-colors hover:bg-[#F3F4F6]"
            >
              <Icon
                icon="solar:alt-arrow-left-linear"
                className="h-5 w-5 text-[#1E2124]"
              />
            </button>
            <div className="flex flex-col">
              <h1 className="text-[20px] font-semibold tracking-[-0.3px] text-[#111827]">
                결제하기
              </h1>
              <span className="mt-0.5 text-[12px] leading-[1.5] text-[#9CA3AF]">
                예약 정보를 확인하고 결제를 진행해 주세요.
              </span>
            </div>
          </div>

          {/* 진행 단계 표시 */}
          <div className="flex items-center gap-2 rounded-full bg-[#F9FAFB] px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF2233]" />
            <span className="text-[11px] font-medium tracking-[0.06em] text-[#6B7280]">
              STEP 2 · 결제정보
            </span>
          </div>
        </header>

        {/* 메인 컨텐츠 영역 */}
        <main className="flex flex-1 flex-col gap-6 lg:flex-row">
          {/* 좌측: 주문/예약 정보 */}
          <section className="flex-1 space-y-6">
            {/* 주문 상품 카드 */}
            <div className="rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              {/* 카드 타이틀 영역 */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#FFF1F2] px-2.5 py-1 text-[11px] font-medium tracking-[-0.2px] text-[#FF2233]">
                    주문상품
                  </span>
                  <span className="text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#111827]">
                    총 주문 상품 {products.length}개
                  </span>
                </div>
              </div>

              {/* 로딩 / 에러 / 상품 리스트 */}
              {loading ? (
                <div className="py-8 text-center text-[13px] text-[#9CA3AF]">
                  주문 정보를 불러오는 중입니다.
                </div>
              ) : error ? (
                <div className="py-8 text-center text-[13px] text-[#EF4444]">
                  {error}
                </div>
              ) : products.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[#9CA3AF]">
                  결제 대기 중인 주문이 없습니다.
                </div>
              ) : (
                products.map((product, index) => (
                  <div key={`${product.orderId}-${product.productId}-${index}`}>
                    {/* 상품 카드 */}
                    <div
                      className={`flex gap-4 border-b border-[#F3F4F6] pb-4 ${
                        index > 0 ? "mt-6" : ""
                      }`}
                    >
                      <div
                        className="h-[92px] w-[92px] flex-shrink-0 rounded-[14px] border border-[#E5E7EB] bg-cover bg-center"
                        style={{
                          backgroundImage: `url('${product.thumbnailUrl}')`,
                        }}
                      />
                      <div className="flex flex-1 flex-col justify-center">
                        <div className="mb-1 text-[13px] leading-[1.5] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
                          {product.shopName ?? "입점 스토어"}
                        </div>
                        <div className="mb-2 whitespace-pre-line text-[15px] leading-[1.4] tracking-[-0.2px] text-[#111827]">
                          {product.productName}
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2">
                          <span className="text-[12px] text-[#9CA3AF]">
                            VAT 포함 금액
                          </span>
                          <span className="text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#111827]">
                            {formatPrice(product.lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 예약 날짜 영역 */}
                    <div className="mt-3 flex items-center justify-between rounded-[12px] bg-[#F7F9FA] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="solar:calendar-outline"
                          className="h-4 w-4 text-[#6B7280]"
                        />
                        <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[rgba(0,0,0,0.6)]">
                          예약일은 매장과 협의 후 확정됩니다.
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-[#9CA3AF]">
                        촬영 일정 변경 시 매장 문의
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 우측: 쿠폰 혜택 + 결제 요약 */}
          <aside className="w-full max-w-sm space-y-4 lg:sticky lg:top-28">
            {/* 쿠폰 혜택 카드 (위) */}
            <div className="rounded-2xl bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.07)]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-medium tracking-[-0.2px] text-[#4F46E5]">
                      혜택
                    </span>
                    <span className="text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#111827]">
                      쿠폰 혜택
                    </span>
                  </div>
                  <span className="text-[11px] text-[#9CA3AF]">
                    보유한 쿠폰을 선택하면 결제금액에 반영돼요.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/checkout/coupon", {
                    state: {
                      products: products.map((p) => ({
                        productId: p.productId,
                        productName: p.productName,
                        lineTotal: p.lineTotal,
                        shopName: p.shopName,
                      })),
                      // ✅ 쿠폰 페이지에도 원가 기준으로 넘김
                      purchaseAmount: totalOriginalPrice,
                    },
                  })
                }
                className="flex h-[52px] w-full items-center justify-between rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-left transition-all hover:border-[#FF2233] hover:bg-[#FFF5F5]"
              >
                {/* 디자인 유지하면서 내용만 쿠폰 선택/적용 상태에 맞게 변경 */}
                <div className="flex flex-col max-w-[240px]">
                  {selectedCouponName ? (
                    <>
                      <span className="text-[13px] font-medium leading-[1.6] tracking-[-0.2px] text-[#111827] truncate">
                        {selectedCouponName}
                      </span>
                      <span className="text-[11px] leading-[1.5] text-[#6B7280]">
                        {couponDiscountAmount > 0
                          ? `쿠폰 할인 -${formatPrice(couponDiscountAmount)}`
                          : "할인 없음"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] font-medium leading-[1.6] tracking-[-0.2px] text-[#111827]">
                        쿠폰 선택
                      </span>
                      <span className="text-[11px] leading-[1.5] text-[#9CA3AF]">
                        사용 가능 {displayApplicableCouponCount}장
                      </span>
                    </>
                  )}
                </div>
                <Icon
                  icon="mdi:chevron-right"
                  className="h-5 w-5 text-[#D1D5DB]"
                />
              </button>
            </div>

            {/* 결제 요약 카드 (아래) */}
            <div className="rounded-2xl bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[18px] font-semibold tracking-[-0.2px] text-[#111827]">
                  결제 요약
                </h2>
                <span className="rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">
                  안전 결제
                </span>
              </div>

              <div className="space-y-3 border-b border-[#F3F4F6] pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] leading-[1.6] tracking-[-0.2px] text-[rgba(0,0,0,0.7)]">
                    총 상품금액
                  </span>
                  <span className="text-[14px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#111827]">
                    {formatPrice(totalOriginalPrice)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[14px] leading-[1.6] tracking-[-0.2px] text-[rgba(0,0,0,0.7)]">
                    총 할인금액
                  </span>
                  <span className="text-[14px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#16A34A]">
                    -{formatPrice(finalDiscountAmount)}
                  </span>
                </div>
              </div>

              <div className="mt-4 mb-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[#111827]">
                    결제금액(합산 기준)
                  </span>
                  <span className="text-[11px] text-[#9CA3AF]">
                    실제 결제는 주문별로 개별 진행되며, 이 금액은 전체 합산
                    금액입니다.
                  </span>
                </div>
                <span className="whitespace-nowrap text-[20px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#111827]">
                  {formatPrice(finalPayAmount)}
                </span>
              </div>

              <div className="mb-4 rounded-[12px] bg-[#F9FAFB] px-3 py-2 text-[11px] text-[#6B7280]">
                <div className="flex items-start gap-2">
                  <Icon
                    icon="solar:shield-check-outline"
                    className="mt-[2px] h-4 w-4 text-[#10B981]"
                  />
                  <p>
                    결제는 주문 단위로 개별 처리되며, 이 화면에서는 여러 주문을
                    한 번에 확인할 수 있어요.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClickPayment}
                className="mt-2 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#FF2233] px-4 text-[15px] font-semibold leading-[1.5] tracking-[-0.2px] text-white shadow-[0_14px_32px_rgba(255,34,51,0.45)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                다음 단계로
              </button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default WebView;
