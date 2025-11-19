// src/pages/CheckoutPage/main/views/MobileView.tsx

import React from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
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

const MobileView: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

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

  const totalOriginalPrice = React.useMemo(
    () => orders.reduce((sum, order) => sum + order.originalPrice, 0),
    [orders]
  );

  const totalDiscountAmount = React.useMemo(
    () => orders.reduce((sum, order) => sum + order.discountAmount, 0),
    [orders]
  );

  const totalAmount = React.useMemo(
    () => orders.reduce((sum, order) => sum + order.totalAmount, 0),
    [orders]
  );

  const formatPrice = (value: number) => `${value.toLocaleString("ko-KR")}원`;

  const handleClickPayment = () => {
    if (orders.length === 0) return;

    const waitingOrder =
      orders.find((o) => o.status === "WAITING_FOR_PAYMENT") ?? orders[0];

    navigate("/checkout/payment", {
      state: {
        orderCode: waitingOrder.orderCode,
      },
    });
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
                  // ✅ 모든 상품 정보를 쿠폰 페이지로 전달
                  products: products.map((p) => ({
                    productId: p.productId,
                    productName: p.productName,
                    lineTotal: p.lineTotal,
                    shopName: p.shopName,
                  })),
                  // 전체 결제 금액
                  purchaseAmount: totalAmount,
                },
              })
            }
            className="flex h-[54px] w-full items-center justify-center rounded-[10px] border border-[#E8E8E8] active:bg-gray-100"
          >
            <div className="flex w-[310px] items-center justify-between">
              <span className="text-[14px] font-medium text-[#1E2124]">
                쿠폰
              </span>
              <div className="flex items-center gap-1">
                <span className="text-right text-[14px] text-[#444444]">
                  사용 가능 0장
                </span>
                <Icon
                  icon="mdi:chevron-down"
                  className="h-4 w-4 text-[#D9D9D9]"
                />
              </div>
            </div>
          </button>
        </section>

        {/* 회색 바 */}
        <div className="-mx-5 my-8 h-2 w-[calc(100%+40px)] bg-[#F7F9FA]" />

        {/* 🔥 여기 추가된 안내 문구 */}
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
              -{formatPrice(totalDiscountAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[16px] font-semibold text-[rgba(0,0,0,0.8)]">
              결제금액
            </span>
            <span className="text-[20px] font-semibold text-[rgba(0,0,0,0.8)]">
              {formatPrice(totalAmount)}
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
