import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import api from "../../../../lib/api/axios";

// ⚠️ 여기 clientKey는 "API 개별 연동 키 > 클라이언트 키 (결제창용)"으로 교체해야 합니다.
const clientKey = "test_ck_24xLea5zVAJWDaom1EBmrQAMYNwW";

// 결제창에서도 customerKey는 필수 (결제창 초기화에 필요)
const customerKey = "4518539793";

// 서버에서 가져오는 주문 타입
type OrderSummary = {
  orderId?: number;
  orderCode: string;
  totalAmount: number;
  status: string;
};

type PaymentLocationState = {
  orderCode?: string;
  couponDiscountAmount?: number; // ✅ 이전 페이지에서 계산된 쿠폰 할인 금액 (UI 표시용)
  userCouponId?: number | null; // ✅ 성공 페이지에서 쿠폰 사용 처리할 때 필요
} | null;

const MobileView = () => {
  const location = useLocation();

  const [amount, setAmount] = useState({
    currency: "KRW" as const,
    value: 0, // ✅ 최종 결제 금액(쿠폰 적용 후)
  });

  const [ready, setReady] = useState(false);
  const [payment, setPayment] = useState<any | null>(null);

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  // ✅ 실제로 사용할 쿠폰 할인 금액 (UI 표시용)
  const [couponDiscountAmount, setCouponDiscountAmount] = useState<number>(0);

  // 금액 변경 함수: amount.value = "최종 결제 금액"
  const updateAmount = (nextAmount: { currency: "KRW"; value: number }) => {
    setAmount(nextAmount);
  };

  // 1) 이전 페이지에서 넘겨준 orderCode + couponDiscountAmount 기반으로 단건 주문 조회
  //    이 시점에는 이미 /orders/{orderCode}/coupon/apply 가 호출되어,
  //    order.totalAmount 에 쿠폰이 반영되어 있다고 가정.
  useEffect(() => {
    async function fetchOrderByOrderCode() {
      try {
        const state = location.state as PaymentLocationState;
        const selectedOrderCode = state?.orderCode;
        const discountFromState = state?.couponDiscountAmount ?? 0;

        setCouponDiscountAmount(discountFromState);

        if (!selectedOrderCode) {
          console.error(
            "[PAYMENT_PAGE_ERROR]",
            "orderCode가 전달되지 않았습니다. 이전 단계에서 orderCode를 넘겨주세요."
          );
          setLoadingOrder(false);
          return;
        }

        const { data } = await api.get<OrderSummary>(
          `/api/v1/orders/${selectedOrderCode}`
        );

        console.log("[ORDER_BY_ORDER_CODE_RESPONSE]", data);

        setOrder(data);

        // ✅ 서버 totalAmount(쿠폰 '적용 후' 최종 결제 금액)를 그대로 사용
        const baseAmount = data.totalAmount ?? 0;

        updateAmount({
          currency: "KRW",
          value: baseAmount,
        });
      } catch (error) {
        console.error("[ORDER_BY_ORDER_CODE_REQUEST_ERROR]", error);
      } finally {
        setLoadingOrder(false);
      }
    }

    fetchOrderByOrderCode();
  }, [location]);

  // 2) 토스 결제창(payment) 인스턴스 초기화
  useEffect(() => {
    async function initPayment() {
      try {
        const tossPayments = await loadTossPayments(clientKey);

        // API 개별 연동 키 → payment() 사용
        const paymentInstance = tossPayments.payment({
          customerKey,
        });

        setPayment(paymentInstance);
        setReady(true);
      } catch (error) {
        console.error("Error initializing TossPayments payment:", error);
        setReady(false);
      }
    }

    initPayment();
  }, []);

  // 3) 결제 요청 핸들러 (토스 결제창 띄우기)
  const handleRequestPayment = async () => {
    if (!payment || !order) {
      console.error(
        "[REQUEST_PAYMENT_BLOCKED]",
        "payment 또는 order 정보가 없습니다.",
        { paymentExists: !!payment, order }
      );
      return;
    }

    try {
      const orderIdForToss = order.orderCode;
      const state = location.state as PaymentLocationState;
      const userCouponId = state?.userCouponId ?? null;

      const successUrl =
        userCouponId !== null && userCouponId !== undefined
          ? `${window.location.origin}/success?userCouponId=${userCouponId}`
          : `${window.location.origin}/success`;

      console.log("[REQUEST_PAYMENT_ORDER_INFO]", {
        orderIdForToss,
        amount, // ✅ 최종 결제 금액 (서버 totalAmount 기준)
        order,
        couponDiscountAmount,
        userCouponId,
      });

      await payment.requestPayment({
        method: "CARD",
        amount, // { currency: 'KRW', value: 최종 결제 금액 }
        orderName: "주문 결제",
        orderId: orderIdForToss,
        customerEmail: "customer123@gmail.com",
        customerName: "김토스",
        customerMobilePhone: "01012341234",
        successUrl,
        failUrl: `${window.location.origin}/fail`,
      });
    } catch (error) {
      console.error("[REQUEST_PAYMENT_ERROR]", error);
    }
  };

  const isButtonDisabled = !ready || loadingOrder || !order;

  // ❗ UI에서 사용할 "원 금액(할인 전)" – 쿠폰 금액을 더해 복원
  const originalAmount = order
    ? order.totalAmount + couponDiscountAmount
    : amount.value + couponDiscountAmount;

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-5 pb-4">
        <header className="mb-5">
          <h1 className="text-[20px] font-semibold tracking-[-0.3px] text-[#111827]">
            결제하기
          </h1>
          <p className="mt-1 text-[12px] text-[#9CA3AF]">
            결제 수단 선택과 약관 동의는 다음 단계에서 진행돼요.
          </p>
          {order && (
            <p className="mt-1 text-[11px] text-[#6B7280]">
              주문번호{" "}
              <span className="font-medium text-[#111827]">
                {order.orderCode}
              </span>
            </p>
          )}

          {/* 결제 금액 카드 */}
          <div className="mt-4 rounded-xl bg-white px-4 py-3 shadow-sm border border-[#E5E7EB]">
            {/* 💰 결제 예정 금액 (할인 전) */}
            <div className="flex items-center justify-between">
              <span className="block text-[11px] text-[#9CA3AF]">
                결제 예정 금액
              </span>
              <span className="mt-1 block text-[16px] font-medium tracking-[-0.3px] text-[#111827]">
                {originalAmount.toLocaleString()}원
              </span>
            </div>

            {/* ✅ 쿠폰 할인 / 최종 결제 금액 */}
            {couponDiscountAmount > 0 && (
              <>
                <div className="mt-2 flex items-center justify-between text-[12px]">
                  <span className="text-[#6B7280]">쿠폰 할인</span>
                  <span className="font-medium text-[#EF4444]">
                    -{couponDiscountAmount.toLocaleString()}원
                  </span>
                </div>

                <div className="h-px w-full bg-[#E5E7EB] my-3" />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#111827]">
                    최종 결제 금액
                  </span>
                  <span className="text-[18px] font-bold tracking-[-0.3px] text-[#111827]">
                    {amount.value.toLocaleString()}원
                  </span>
                </div>
              </>
            )}

            {/* 쿠폰 없으면 "최종 결제 금액"만 한 줄로 깔끔하게 */}
            {couponDiscountAmount === 0 && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#111827]">
                  최종 결제 금액
                </span>
                <span className="text-[18px] font-bold tracking-[-0.3px] text-[#111827]">
                  {amount.value.toLocaleString()}원
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 space-y-4 pb-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)] border border-[#E5E7EB]">
            <section className="mb-5">
              <div className="mb-3 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[10px] font-medium text-[#4F46E5]">
                    결제수단
                  </span>
                  <span className="text-[14px] font-semibold text-[#111827]">
                    결제 수단은 결제창에서 선택해요
                  </span>
                </div>
                <span className="text-[11px] text-[#9CA3AF]">
                  결제하기 버튼을 누르면 토스페이먼츠 결제창이 열립니다.
                </span>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-3 text-[11px] text-[#6B7280] leading-relaxed">
                <p className="mb-1">
                  이 화면에서는 주문 정보와 결제 금액만 확인할 수 있어요.
                </p>
                <p>
                  실제 카드 / 간편결제 선택과 약관 동의는 토스페이먼츠
                  결제창에서 진행됩니다.
                </p>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[10px] font-medium text-[#D97706]">
                  필수
                </span>
                <span className="text-[14px] font-semibold text-[#111827]">
                  약관 동의 안내
                </span>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5 py-3 text-[11px] text-[#6B7280] leading-relaxed">
                <p className="mb-1">
                  결제창에서 토스페이먼츠 약관과 결제수단 약관에 동의한 후
                  결제가 완료됩니다.
                </p>
                <p>
                  이 화면은 약관 표시 페이지가 아니라, 결제창으로 전달할 주문
                  정보를 구성하는 용도입니다.
                </p>
              </div>
            </section>
          </div>
        </main>

        <div className="-mx-4 sticky bottom-0 left-0 right-0 border-t border-[#E5E7EB] bg-[#F5F6FA]/95 backdrop-blur">
          <div className="mx-auto w-full max-w-md px-4 pt-2 pb-3 space-y-2">
            <div className="rounded-lg bg-[#F9FAFB] px-3 py-2 text-[11px] text-[#6B7280] leading-snug">
              {loadingOrder && (
                <p>주문 정보를 불러오는 중입니다. 잠시만 기다려 주세요.</p>
              )}
              {!loadingOrder && !order && (
                <p>
                  결제 가능한 주문이 없습니다. 주문을 먼저 생성한 뒤 다시 시도해
                  주세요.
                </p>
              )}
              {!loadingOrder && order && (
                <p>
                  결제하기 버튼을 누르면 토스페이먼츠 결제창으로 이동합니다.
                  결제 실패 시 다시 시도하거나 다른 수단을 선택할 수 있어요.
                </p>
              )}
            </div>

            <button
              className={`mt-1 flex h-12 w-full items-center justify-center rounded-[999px] text-[15px] font-semibold tracking-[-0.2px] transition-transform ${
                !isButtonDisabled
                  ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.99] shadow-[0_10px_25px_rgba(37,99,235,0.35)]"
                  : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed shadow-none"
              }`}
              disabled={isButtonDisabled}
              onClick={handleRequestPayment}
            >
              {loadingOrder
                ? "주문 정보 불러오는 중..."
                : !order
                ? "결제 가능한 주문이 없습니다"
                : "결제하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
