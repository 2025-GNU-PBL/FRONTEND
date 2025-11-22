import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import api from "../../../../lib/api/axios";
import { useAppSelector } from "../../../../store/hooks";

// ⚠️ 여기 clientKey는 "API 개별 연동 키 > 클라이언트 키 (결제창용)"으로 교체해야 합니다.
//    예: test_ck_... 형태 (위젯 키인 test_gck_... 쓰면 에러 납니다)
const clientKey = "test_ck_24xLea5zVAJWDaom1EBmrQAMYNwW";

// 서버에서 가져오는 주문 타입 (필요한 필드만 정의)
type OrderSummary = {
  orderId?: number; // 있어도 되고 없어도 됨 (우리는 orderCode, totalAmount만 사용)
  orderCode: string;
  totalAmount: number;
  status: string;
};

type PaymentLocationState = {
  orderCode?: string;
  couponDiscountAmount?: number; // 이전 페이지에서 쿠폰 할인 금액(표시용)
  userCouponId?: number | null; // 성공 페이지 쿼리 파라미터로 전달용
} | null;

const WebView = () => {
  const location = useLocation();

  // 🔹 Redux에서 socialId 가져와서 customerKey로 사용
  const socialId = useAppSelector((state) => state.user.userData?.socialId);
  const customerKey = socialId; // string | undefined 이므로 아래 useEffect에서 가드

  const [amount, setAmount] = useState({
    currency: "KRW" as const,
    value: 0,
  });

  const [ready, setReady] = useState(false);
  const [payment, setPayment] = useState<any | null>(null);

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  // 쿠폰 할인 금액 (UI 표시용)
  const [couponDiscountAmount, setCouponDiscountAmount] = useState<number>(0);

  // 금액 변경이 필요하면 이 함수로 상태만 바꾸면 됩니다.
  const updateAmount = (nextAmount: { currency: "KRW"; value: number }) => {
    setAmount(nextAmount);
  };

  // 1) 이전 페이지에서 넘긴 orderCode + couponDiscountAmount 기반으로 단일 주문 조회
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

        // ✅ /api/v1/orders/{orderCode} 단건 조회
        const { data } = await api.get<OrderSummary>(
          `/api/v1/orders/${selectedOrderCode}`
        );

        console.log("[ORDER_BY_ORDER_CODE_RESPONSE]", data);

        setOrder(data);

        // ✅ 토스 결제 amount는 단건 주문의 totalAmount(쿠폰 적용 후) 기준으로 설정
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

  // 2) 결제창(payment) 인스턴스 초기화
  useEffect(() => {
    async function initPayment() {
      // 🔥 customerKey가 아직 없으면 초기화 막기 (타입도 string으로 좁혀짐)
      if (!customerKey) {
        console.error(
          "[INIT_PAYMENT_BLOCKED]",
          "customerKey가 없습니다. socialId를 확인해 주세요."
        );
        setReady(false);
        return;
      }

      try {
        const tossPayments = await loadTossPayments(clientKey);

        // ✅ API 개별 연동 키로는 widgets()가 아니라 payment()를 써야 합니다.
        const paymentInstance = tossPayments.payment({
          customerKey, // 여기서는 string 타입으로 안전
        });

        setPayment(paymentInstance);
        setReady(true);
      } catch (error) {
        console.error("Error initializing TossPayments payment:", error);
        setReady(false);
      }
    }

    initPayment();
  }, [customerKey]); // socialId가 나중에 세팅되면 다시 시도

  // 3) 결제 요청 핸들러 (결제창 띄우기)
  const handleRequestPayment = async () => {
    // 토스 결제 인스턴스 or 주문 정보가 없으면 실행 X
    if (!payment || !order) {
      console.error(
        "[REQUEST_PAYMENT_BLOCKED]",
        "payment 또는 order 정보가 없습니다.",
        { paymentExists: !!payment, order }
      );
      return;
    }

    try {
      // ✅ orderId는 서버에서 내려준 orderCode를 사용
      const orderIdForToss = order.orderCode;

      const state = location.state as PaymentLocationState;
      const userCouponId = state?.userCouponId ?? null;

      const successUrl =
        userCouponId !== null && userCouponId !== undefined
          ? `${window.location.origin}/success?userCouponId=${userCouponId}`
          : `${window.location.origin}/success`;

      console.log("[REQUEST_PAYMENT_ORDER_INFO]", {
        orderIdForToss,
        amount,
        order,
        couponDiscountAmount,
        userCouponId,
      });

      // ✅ 결제창 방식: payment.requestPayment() 사용
      await payment.requestPayment({
        method: "CARD", // 카드/간편결제 통합결제창
        amount, // { value, currency } ← 서버 totalAmount 기반
        orderName: "주문 결제",
        orderId: orderIdForToss,
        customerEmail: "customer123@gmail.com",
        customerName: "김토스",
        customerMobilePhone: "01012341234",
        successUrl,
        failUrl: `${window.location.origin}/fail`,
      });

      // Redirect 방식이라 여기 아래 코드는 실행 안 되고, success/fail 페이지로 바로 이동함
    } catch (error) {
      // 결제창 열기 자체가 실패했을 때 (키 잘못됨, 파라미터 오류 등)
      console.error("[REQUEST_PAYMENT_ERROR]", error);
    }
  };

  const isButtonDisabled = !ready || loadingOrder || !order;

  // ❗ UI에서 사용할 "원 금액(할인 전)" – 쿠폰 금액을 더해 복원
  const originalAmount = order
    ? order.totalAmount + couponDiscountAmount
    : amount.value + couponDiscountAmount;

  return (
    <div className="wrapper min-h-screen bg-[#F5F6FA] pt-24 pb-16 flex justify-center">
      <div className="w-full max-w-3xl px-4">
        {/* 상단 타이틀 / 금액 요약 */}
        <header className="mb-6 flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] font-semibold tracking-[-0.3px] text-[#111827]">
              결제하기
            </h1>
            <p className="text-[13px] text-[#9CA3AF]">
              결제 수단을 선택하고, 약관 동의 후 결제를 진행해 주세요.
            </p>
            {order && (
              <p className="text-[12px] text-[#6B7280]">
                주문번호: <span className="font-medium">{order.orderCode}</span>
              </p>
            )}
          </div>
          <div className="rounded-xl bg-white px-4 py-2 shadow-sm border border-[#E5E7EB] text-right">
            <span className="block text-[11px] text-[#9CA3AF]">
              결제 예정 금액
            </span>
            <span className="text-md font-semibold tracking-[-0.2px] text-[#111827]">
              {amount.value.toLocaleString()}원
            </span>
            {couponDiscountAmount > 0 && (
              <div className="mt-1 text-[11px] text-[#EF4444]">
                쿠폰 할인 -{couponDiscountAmount.toLocaleString()}원
              </div>
            )}
            {couponDiscountAmount > 0 && (
              <div className="text-[10px] text-[#9CA3AF]">
                (할인 전 {originalAmount.toLocaleString()}원)
              </div>
            )}
          </div>
        </header>

        {/* 메인 카드 */}
        <div className="box_section rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] border border-[#E5E7EB]">
          {/* 결제 안내 영역 */}
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-medium text-[#4F46E5]">
                  결제수단
                </span>
                <span className="text-[15px] font-semibold text-[#111827]">
                  결제 수단은 다음 단계에서 선택해요
                </span>
              </div>
              <span className="text-[11px] text-[#9CA3AF]">
                결제하기 버튼을 누르면 토스페이먼츠 결제창이 열립니다.
              </span>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-4 text-[12px] text-[#6B7280] leading-relaxed">
              <p className="mb-1">
                이 페이지에서는 주문 정보와 결제 금액만 확인해요.
              </p>
              <p>
                실제 카드/간편결제 선택과 약관 동의는 토스페이먼츠 결제창에서
                진행됩니다.
              </p>
            </div>
          </section>

          {/* 약관 안내 영역 */}
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-medium text-[#D97706]">
                필수
              </span>
              <span className="text-[15px] font-semibold text-[#111827]">
                약관 동의
              </span>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-4 text-[12px] text-[#6B7280] leading-relaxed">
              <p className="mb-1">
                결제창에서 토스페이먼츠 약관 및 결제수단 약관에 동의한 후 결제가
                완료됩니다.
              </p>
              <p>
                이 페이지는 약관 표시용이 아니라, 결제창에 전달할 주문 정보를
                구성하는 용도입니다.
              </p>
            </div>
          </section>

          {/* 하단 안내 + 버튼 */}
          <section>
            <div className="mb-3 rounded-xl bg-[#F9FAFB] px-3 py-2 text-[11px] text-[#6B7280]">
              {loadingOrder && (
                <p>주문 정보를 불러오는 중입니다. 잠시만 기다려 주세요.</p>
              )}
              {!loadingOrder && !order && (
                <p>
                  결제 가능한 주문이 없습니다. 주문을 먼저 생성하거나 이전
                  단계에서 다시 시도해 주세요.
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
              className={`button mt-3 flex h-12 w-full items-center justify-center rounded-[999px] text-[15px] font-semibold tracking-[-0.2px] transition-transform ${
                !isButtonDisabled
                  ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:scale-[1.01] shadow-[0_12px_30px_rgba(37,99,235,0.35)]"
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
          </section>
        </div>
      </div>
    </div>
  );
};

export default WebView;
