import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import type { ConfirmResponse, PaymentDetail } from "../Success";

export interface MobileViewProps {
  loading: boolean; // confirm 로딩
  responseData: ConfirmResponse | null;
  paymentKey: string;
  orderId: string;

  paymentDetail: PaymentDetail | null;
  detailLoading: boolean;
  detailError: string | null;
}

const MobileView = ({
  loading,
  orderId,
  paymentDetail,
  detailLoading,
  detailError,
}: MobileViewProps) => {
  const navigate = useNavigate();

  // confirm 로딩이거나, detail 로딩 중이면 로딩 화면
  if (loading || detailLoading) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-white">
        <header className="flex h-[60px] items-center justify-between px-5">
          <div className="h-6 w-6" />
          <div className="text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
            결제 확인 중
          </div>
          <div className="h-6 w-6" />
        </header>

        <main className="flex flex-1 items-center justify-center px-5 pb-10">
          <div className="bg-white rounded-2xl shadow-lg px-6 py-5 text-[#4b5563] flex items-center gap-3 w-full border border-[#e5e7eb]">
            <div className="w-6 h-6 border-2 border-[#3182f6] border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px]">
              결제 정보를 확인하는 중입니다. 잠시만 기다려 주세요.
            </span>
          </div>
        </main>
      </div>
    );
  }

  // detail 에러
  if (detailError || !paymentDetail) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-white">
        <header className="flex h-[60px] items-center justify-between px-5">
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

          <div className="text-[18px] font-semibold leading-[1.6] tracking-[-0.2px] text-[#1E2124]">
            결제 결과
          </div>

          <div className="h-6 w-6" />
        </header>

        <main className="flex flex-1 items-center justify-center px-5 pb-10">
          <div className="bg-white rounded-2xl shadow-lg px-6 py-6 text-center text-[#4b5563] w-full border border-[#e5e7eb]">
            <h2 className="text-[18px] font-semibold text-[#111827] mb-2">
              결제 정보를 불러오지 못했어요
            </h2>
            <p className="text-[13px] text-[#6b7280] mb-3">
              잠시 후 다시 시도해 주세요. 문제가 계속된다면 고객센터로 문의해
              주세요.
            </p>
            {detailError && (
              <p className="text-[11px] text-[#9ca3af]">{detailError}</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ---- payments 상세 응답 사용 ----
  const {
    orderCode,
    shopName,
    productName,
    thumbnailUrl,
    originalPrice,
    discountAmount,
    totalPrice,
    paidAmount,
    status,
    approvedAt,
    receiptUrl,
    paymentMethod,
  } = paymentDetail;

  const finalOrderCode = orderCode || orderId;
  const finalPaidAmount =
    typeof paidAmount === "number" && paidAmount > 0 ? paidAmount : totalPrice;

  // ✅ 쿠폰 할인 금액 표시: 0이면 "0원", 0보다 크면 "-10,000원" 형태
  const discountValue =
    typeof discountAmount === "number" && discountAmount > 0
      ? discountAmount
      : 0;
  const discountDisplay =
    discountValue > 0 ? `-${discountValue.toLocaleString()}원` : "0원";

  const formattedApprovedAt = approvedAt
    ? new Date(approvedAt).toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  const isDone = status === "DONE";

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  const handleGoOrders = () => {
    navigate("/checkout");
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-white text-[#1E2124]">
      {/* 본문 */}
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-[120px]">
        {/* 상단 배지 + 타이틀 */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium mb-4 ${
              isDone
                ? "bg-[#ecfdf3] text-[#15803d]"
                : "bg-[#fff7ed] text-[#c2410c]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDone ? "bg-[#22c55e]" : "bg-[#f97316]"
              }`}
            />
            <span>
              {isDone
                ? "결제가 성공적으로 완료되었습니다"
                : "결제 상태를 확인해 주세요"}
            </span>
          </div>

          <img
            width={72}
            src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
            alt="결제 완료 이미지"
            className="mb-3"
          />

          <h2 className="text-[20px] font-semibold text-[#111827]">
            {isDone ? "결제를 완료했어요" : "결제 처리 중입니다"}
          </h2>
          <p className="mt-2 text-[12px] text-[#6b7280]">
            {isDone
              ? "결제가 정상 처리되었으며, 아래 결제 및 상품 내역을 확인해 주세요."
              : "결제 상태가 완료로 변경되었는지 주문 내역에서 다시 한 번 확인해 주세요."}
          </p>
        </div>

        {/* 주요 금액 섹션 */}
        <div className="mt-6 rounded-2xl bg-[#f9fafb] border border-[#e5e7eb] px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[12px] text-[#6b7280]">총 결제 금액</span>
            <span className="mt-1 text-[20px] font-semibold text-[#111827]">
              {finalPaidAmount.toLocaleString()}원
            </span>
          </div>
          {paymentMethod && (
            <div className="text-right">
              <span className="inline-flex items-center rounded-full bg-white border border-[#e5e7eb] px-3 py-1 text-[11px] text-[#4b5563]">
                결제수단&nbsp;
                <span className="font-semibold text-[#111827]">
                  {paymentMethod}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* 결제 기본 정보 섹션 */}
        <div className="mt-5">
          <h3 className="text-[13px] font-semibold text-[#111827] mb-3">
            결제 정보
          </h3>

          <div className="space-y-2.5 text-[12px]">
            {shopName && (
              <div className="flex gap-3">
                <span className="text-[#6b7280]">가맹점</span>
                <span className="font-medium text-[#111827] text-right break-words flex-1">
                  {shopName}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <span className="text-[#6b7280]">주문번호</span>
              <span className="font-medium text-[#111827] break-all text-right flex-1">
                {finalOrderCode}
              </span>
            </div>

            {formattedApprovedAt && (
              <div className="flex gap-3">
                <span className="text-[#6b7280]">결제 일시</span>
                <span className="text-[#111827] text-right flex-1">
                  {formattedApprovedAt}
                </span>
              </div>
            )}

            {receiptUrl && (
              <div className="flex items-center gap-3">
                <span className="text-[#6b7280]">영수증</span>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8] underline underline-offset-2 text-right flex-1"
                >
                  영수증 확인하기
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div className="my-5 border-t border-dashed border-[#e5e7eb]" />

        {/* 상품 결제 정보 섹션 */}
        <div>
          <h3 className="text-[13px] font-semibold text-[#111827] mb-3">
            상품 결제 정보
          </h3>

          {/* 상품 카드 */}
          <div className="flex gap-3 items-center mb-4">
            {thumbnailUrl && (
              <div className="w-16 h-16 rounded-xl bg-[#f3f4f6] overflow-hidden flex-shrink-0">
                <img
                  src={thumbnailUrl}
                  alt="img"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              {shopName && (
                <p className="text-[11px] text-[#9ca3af] mb-0.5">{shopName}</p>
              )}
              <p className="text-[14px] font-medium text-[#111827] break-words">
                {productName}
              </p>
            </div>
          </div>

          {/* 금액 디테일 */}
          <div className="space-y-2.5 text-[12px]">
            {/* 상품 금액 */}
            <div className="flex gap-3">
              <span className="text-[#6b7280]">상품 금액</span>
              <span className="font-medium text-[#111827] text-right flex-1">
                {originalPrice.toLocaleString()}원
              </span>
            </div>

            {/* 할인 금액 - 오른쪽 끝 정렬 + 0원일 땐 마이너스 없이 */}
            <div className="flex gap-3">
              <span className="text-[#6b7280]">할인 금액</span>
              <span className="font-medium text-[#16a34a] text-right flex-1">
                {discountDisplay}
              </span>
            </div>

            {/* 최종 결제 금액 */}
            <div className="flex gap-3 pt-2 border-t border-dashed border-[#e5e7eb] mt-2">
              <span className="text-[#4b5563] font-medium">최종 결제 금액</span>
              <span className="font-semibold text-[#111827] text-right flex-1">
                {finalPaidAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 하단 안내 문구 */}
        <p className="mt-5 text-[11px] text-[#9ca3af] leading-relaxed">
          주문 내역 및 결제 취소가 필요하신 경우, 서비스 내 주문/결제 내역에서
          상세 정보를 확인하시거나 고객센터로 문의해 주세요.
        </p>
      </main>

      {/* 하단 버튼 영역 */}
      <div className="fixed bottom-0 left-1/2 w-full max-w-[390px] -translate-x-1/2 bg-white px-5 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleGoHome}
            className="flex h-12 flex-1 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white"
          >
            <span className="text-[14px] font-medium text-[#1E2124]">
              홈으로
            </span>
          </button>
          <button
            type="button"
            onClick={handleGoOrders}
            className="flex h-12 flex-1 items-center justify-center rounded-[12px] bg-[#111827]"
          >
            <span className="text-[14px] font-semibold text-white">
              결제 계속하기
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileView;
