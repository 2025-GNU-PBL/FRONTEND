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
  discountAmount: number; // 서버에는 있을 수 있지만, 화면 계산에서는 안 씀
  totalAmount: number; // 서버에는 있을 수 있지만, 화면 계산에서는 안 씀
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

// 쿠폰 타입 (쿠폰 페이지에서 전달되는 값과 동일 구조)
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

// 쿠폰 페이지에서 되돌아올 때 받는 state 타입
interface CheckoutLocationState {
  selectedCouponId?: number | null; // == userCouponId
  selectedCoupon?: Coupon | null;
  discountAmount?: number; // 선택된 쿠폰 기준 할인액
  productId?: number;
  appliedAmount?: number;
  applicableCount?: number;
}

const MobileView: React.FC = () => {
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

  // 쿠폰 페이지에서 돌아올 때 전달된 state
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

  // 최초 진입 시, 맨 위 상품 + 전체 결제 금액 기준으로 사용 가능한 쿠폰 개수 조회
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

  const formatPrice = (value: number) => `${value.toLocaleString("ko-KR")}원`;

  // ✅ 결제 버튼 클릭 시: 주문에 쿠폰 먼저 적용 → 그 다음 결제 페이지로 이동
  const handleClickPayment = async () => {
    if (orders.length === 0) return;

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

      // 주문에 쿠폰까지 반영된 상태로 결제 페이지로 이동
      // 결제 페이지에서는 서버의 totalAmount(쿠폰 적용 후 금액)를 그대로 사용
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
    <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-white text-[#1E2124]">
      {/* 헤더 */}
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

        <div className="absolute left-1/2 -translate-x-1/2 text-center text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
          결제하기
        </div>

        <div className="h-6 w-6" />
      </header>

      {/* 컨텐츠 */}
      <main className="flex-1 overflow-y-auto px-5 pb-[140px]">
        {/* 총 주문 상품 */}
        <div className="mt-5 mb-5 flex items-center gap-3">
          <span className="text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
            총 주문 상품 {products.length}개
          </span>
        </div>

        {/* 로딩 / 에러 / 상품 리스트 */}
        {loading ? (
          <div className="py-6 text-center text-[13px] text-[#9CA3AF]">
            주문 정보를 불러오는 중입니다.
          </div>
        ) : error ? (
          <div className="py-6 text-center text-[13px] text-[#EF4444]">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="py-6 text-center text-[13px] text-[#9CA3AF]">
            결제 대기 중인 주문이 없습니다.
          </div>
        ) : (
          <>
            {products.map((product, index) => (
              <React.Fragment
                key={`${product.orderId}-${product.productId}-${index}`}
              >
                <div className="flex gap-3 px-5 pb-3 pl-5 pr-5">
                  <div
                    className="h-20 w-20 flex-shrink-0 rounded border border-[#F5F5F5] bg-center bg-cover"
                    style={{
                      backgroundImage: `url('${product.thumbnailUrl}')`,
                    }}
                  />
                  <div className="flex flex-1 flex-col justify-center">
                    <div className="mb-1 text-[14px] leading-[1.5] tracking-[-0.2px] text-[rgba(0,0,0,0.4)]">
                      {product.shopName ?? "입점 스토어"}
                    </div>

                    <div className="whitespace-pre-line text-[14px] leading-[1.5] tracking-[-0.2px] text-[#1E2124]">
                      {product.productName}
                    </div>

                    <div className="mt-auto self-end text-[16px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
                      {formatPrice(product.lineTotal)}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex h-[42px] items-center rounded bg-[#F7F9FA] px-4">
                  <span className="text-[12px] leading-[1.5] tracking-[-0.1px] text-[rgba(0,0,0,0.4)]">
                    예약일은 매장과 협의 후 확정됩니다.
                  </span>
                </div>

                {index < products.length - 1 && (
                  <div className="my-3 w-full border-b border-[#F5F5F5]" />
                )}
              </React.Fragment>
            ))}
          </>
        )}

        {/* 회색 바 */}
        <div className="-mx-5 my-5 h-2 w-[calc(100%+40px)] bg-[#F7F9FA]" />

        {/* 쿠폰 섹션 */}
        <section className="mt-5 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
              쿠폰 혜택
            </span>
          </div>

          <button
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
            className="flex h-[54px] w-full items-center justify-center rounded-[10px] border border-[#E8E8E8] active:bg-gray-100"
          >
            <div className="flex w-[310px] h-[22px] items-center justify-between">
              {selectedCouponName ? (
                <>
                  <span className="w-[228px] text-[14px] leading-[1.5] tracking-[-0.2px] text-[#000000] truncate">
                    {selectedCouponName}
                  </span>
                  <div className="flex items-center gap-1 w-[82px] justify-end">
                    <span className="whitespace-nowrap text-[14px] text-[#444444] text-right">
                      {couponDiscountAmount > 0
                        ? `-${formatPrice(couponDiscountAmount)}`
                        : "-0원"}
                    </span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      className="h-4 w-4 text-[#D9D9D9]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[14px] font-medium text-[#1E2124]">
                    쿠폰
                  </span>
                  <div className="flex items-center gap-1 w-[82px] justify-end">
                    <span className="whitespace-nowrap text-right text-[14px] text-[#444444]">
                      {`사용 가능 ${displayApplicableCouponCount}장`}
                    </span>
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      className="h-4 w-4 text-[#D9D9D9]"
                    />
                  </div>
                </>
              )}
            </div>
          </button>
        </section>

        {/* 회색 바 */}
        <div className="-mx-5 my-8 h-2 w-[calc(100%+40px)] bg-[#F7F9FA]" />

        {/* 안내 문구 */}
        <div className="mb-4 rounded-[10px] bg-[#F9FAFB] px-3 py-3 text-[12px] leading-[1.5] text-[#6B7280]">
          결제는 주문 단위로 개별 처리되며, 이 화면에서는 여러 주문을 한 번에
          확인할 수 있어요.
        </div>

        {/* 결제 금액 요약 */}
        <section className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[16px] text-[rgba(0,0,0,0.8)]">
              총 상품금액
            </span>
            <span className="text-[16px] font-semibold text-[rgba(0,0,0,0.8)]">
              {formatPrice(totalOriginalPrice)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[16px] text-[rgba(0,0,0,0.8)]">
              총 할인금액
            </span>
            <span className="text-[16px] font-semibold text-[rgba(0,0,0,0.8)]">
              -{formatPrice(finalDiscountAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[16px] font-semibold text-[rgba(0,0,0,0.8)]">
              결제금액
            </span>
            <span className="text-[20px] font-semibold text-[rgba(0,0,0,0.8)]">
              {formatPrice(finalPayAmount)}
            </span>
          </div>
        </section>
      </main>

      {/* 하단 결제 버튼 */}
      <div className="fixed bottom-0 left-1/2 w-full max-w-[390px] -translate-x-1/2 bg-white px-5 py-5 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <button
          type="button"
          onClick={handleClickPayment}
          className="flex h-14 w-full items-center justify-center rounded-[12px] bg-[#FF2233]"
        >
          <span className="text-[16px] font-semibold text-white">
            다음 단계로
          </span>
        </button>
      </div>
    </div>
  );
};

export default MobileView;
