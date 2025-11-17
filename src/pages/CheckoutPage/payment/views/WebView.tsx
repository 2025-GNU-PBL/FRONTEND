import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useEffect, useState } from "react";

// ⚠️ 여기 clientKey는 "API 개별 연동 키 > 클라이언트 키 (결제창용)"으로 교체해야 합니다.
//    예: test_ck_... 형태 (위젯 키인 test_gck_... 쓰면 에러 납니다)
const clientKey = "test_ck_24xLea5zVAJWDaom1EBmrQAMYNwW";

// 결제창에서도 customerKey는 필수 (결제창 초기화에 필요)
const customerKey = "4518539793";

const WebView = () => {
  const [amount, setAmount] = useState({
    currency: "KRW" as const,
    value: 50000,
  });

  const [ready, setReady] = useState(false);
  const [payment, setPayment] = useState<any | null>(null);

  // 1) 결제창(payment) 인스턴스 초기화 (widgets 완전 제거)
  useEffect(() => {
    async function initPayment() {
      try {
        const tossPayments = await loadTossPayments(clientKey);

        // ✅ API 개별 연동 키로는 widgets()가 아니라 payment()를 써야 합니다.
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

  // 혹시 금액 변경이 필요하면 이 함수로 상태만 바꾸면 됩니다.
  const updateAmount = (nextAmount: { currency: "KRW"; value: number }) => {
    setAmount(nextAmount);
  };

  // 결제 요청 핸들러 (결제창 띄우기)
  const handleRequestPayment = async () => {
    if (!payment) return;

    try {
      const orderId = generateRandomString();

      // ✅ 결제창 방식: payment.requestPayment() 사용
      await payment.requestPayment({
        method: "CARD", // 카드/간편결제 통합결제창
        amount, // { value, currency }
        orderName: "토스 티셔츠 외 2건",
        orderId,
        customerEmail: "customer123@gmail.com",
        customerName: "김토스",
        customerMobilePhone: "01012341234",
        successUrl: `${window.location.origin}/success`,
        failUrl: `${window.location.origin}/fail`,
      });

      // Redirect 방식이라 여기 아래 코드는 실행 안 되고, success/fail 페이지로 바로 이동함
    } catch (error) {
      // 결제창 열기 자체가 실패했을 때 (키 잘못됨, 파라미터 오류 등)
      console.error(error);
    }
  };

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
          </div>
          <div className="rounded-xl bg-white px-4 py-2 shadow-sm border border-[#E5E7EB] text-right">
            <span className="block text-[11px] text-[#9CA3AF]">
              결제 예정 금액
            </span>
            <span className="text-md font-semibold tracking-[-0.2px] text-[#111827]">
              {amount.value.toLocaleString()}원
            </span>
          </div>
        </header>

        {/* 메인 카드 */}
        <div className="box_section rounded-2xl bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] border border-[#E5E7EB]">
          {/* 결제 안내 영역 (위젯 UI 대신 텍스트 안내만 유지) */}
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

          {/* 약관 안내 영역 (실제 약관 UI는 결제창에서 처리됨) */}
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
              <p>
                결제하기 버튼을 누르면 토스페이먼츠 결제창으로 이동합니다. 결제
                실패 시 다시 시도하거나 다른 수단을 선택할 수 있어요.
              </p>
            </div>

            <button
              className={`button mt-3 flex h-12 w-full items-center justify-center rounded-[999px] text-[15px] font-semibold tracking-[-0.2px] transition-transform ${
                ready
                  ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:scale-[1.01] shadow-[0_12px_30px_rgba(37,99,235,0.35)]"
                  : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed shadow-none"
              }`}
              disabled={!ready}
              onClick={handleRequestPayment}
            >
              결제하기
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

function generateRandomString(length = 16) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default WebView;
