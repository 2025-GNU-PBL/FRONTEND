import type { ConfirmResponse, PaymentDetail } from "../Success";
import { useNavigate } from "react-router-dom";

interface WebViewProps {
  loading: boolean; // confirm 로딩
  responseData: ConfirmResponse | null; // 이제는 안 써도 됨 (호환용으로만 남김)
  paymentKey: string;
  orderId: string;

  // ✅ Success에서 내려주는 결제 상세 정보 관련 상태
  paymentDetail: PaymentDetail | null;
  detailLoading: boolean;
  detailError: string | null;
}

const WebView = ({
  loading,
  orderId,
  paymentDetail,
  detailLoading,
  detailError,
}: WebViewProps) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  const handleGoOrders = () => {
    navigate("/checkout");
  };

  // confirm 로딩이거나, detail 로딩 중이면 로딩 화면
  if (loading || detailLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
        <div className="bg-white rounded-2xl shadow-lg px-10 py-8 text-[#4b5563] flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#3182f6] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm sm:text-base">
            결제 정보를 확인하는 중입니다. 잠시만 기다려 주세요.
          </span>
        </div>
      </div>
    );
  }

  // detail 에러
  if (detailError || !paymentDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] px-4">
        <div className="bg-white rounded-2xl shadow-lg px-8 py-6 text-center text-[#4b5563] max-w-md w-full">
          <h2 className="text-lg font-semibold text-[#111827] mb-2">
            결제 정보를 불러오지 못했어요
          </h2>
          <p className="text-sm text-[#6b7280] mb-3">
            잠시 후 다시 시도해 주세요. 문제가 계속된다면 고객센터로 문의해
            주세요.
          </p>
          {detailError && (
            <p className="text-xs text-[#9ca3af]">{detailError}</p>
          )}
        </div>
      </div>
    );
  }

  // ---- 여기부터는 payments API 응답만 사용 ----
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e5f1ff] to-[#f9fafb] flex flex-col items-center px-4 py-10">
      {/* 메인 카드 */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.09)] border border-[#e5e7eb] px-6 py-7 sm:px-8 sm:py-9">
        {/* 상단 헤더 */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 ${
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
            width={80}
            src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
            alt="결제 완료 이미지"
            className="mb-3"
          />

          <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#111827]">
            {isDone ? "결제를 완료했어요" : "결제 처리 중입니다"}
          </h2>
          <p className="mt-2 text-[13px] sm:text-[14px] text-[#6b7280]">
            {isDone
              ? "결제가 정상 처리되었으며, 아래 결제 및 상품 내역을 확인해 주세요."
              : "결제 상태가 완료로 변경되었는지 주문 내역에서 다시 한 번 확인해 주세요."}
          </p>
        </div>

        {/* 주요 금액 섹션 */}
        <div className="mt-7 sm:mt-8 rounded-2xl bg-[#f9fafb] border border-[#e5e7eb] px-5 py-4 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[13px] text-[#6b7280]">총 결제 금액</span>
            <span className="mt-1 text-[22px] sm:text-[24px] font-semibold text-[#111827]">
              {finalPaidAmount.toLocaleString()}원
            </span>
          </div>
          {paymentMethod && (
            <div className="text-right">
              <span className="inline-flex items-center rounded-full bg-white border border-[#e5e7eb] px-3 py-1 text-[11px] sm:text-[12px] text-[#4b5563]">
                결제수단&nbsp;
                <span className="font-semibold text-[#111827]">
                  {paymentMethod}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* 결제 기본 정보 섹션 */}
        <div className="mt-6 sm:mt-7">
          <h3 className="text-[14px] font-semibold text-[#111827] mb-3">
            결제 정보
          </h3>

          <div className="space-y-2.5 text-[13px] sm:text-[14px]">
            {shopName && (
              <div className="flex justify-between gap-3">
                <span className="text-[#6b7280]">가맹점</span>
                <span className="font-medium text-[#111827] text-right break-words">
                  {shopName}
                </span>
              </div>
            )}

            <div className="flex justify-between gap-3">
              <span className="text-[#6b7280]">주문번호</span>
              <span className="font-medium text-[#111827] break-all text-right">
                {finalOrderCode}
              </span>
            </div>

            {formattedApprovedAt && (
              <div className="flex justify-between gap-3">
                <span className="text-[#6b7280]">결제 일시</span>
                <span className="text-[#111827] text-right">
                  {formattedApprovedAt}
                </span>
              </div>
            )}

            {receiptUrl && (
              <div className="flex justify-between items-center gap-3">
                <span className="text-[#6b7280]">영수증</span>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] sm:text-[14px] font-medium text-[#2563eb] hover:text-[#1d4ed8] underline underline-offset-2"
                >
                  영수증 확인하기
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div className="my-6 border-t border-dashed border-[#e5e7eb]" />

        {/* 상품 결제 정보 섹션 */}
        <div>
          <h3 className="text-[14px] font-semibold text-[#111827] mb-3">
            상품 결제 정보
          </h3>

          {/* 상품 카드 */}
          <div className="flex gap-3 sm:gap-4 items-center mb-4">
            {thumbnailUrl && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#f3f4f6] overflow-hidden flex-shrink-0">
                <img
                  src={thumbnailUrl}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              {shopName && (
                <p className="text-[11px] sm:text-[12px] text-[#9ca3af] mb-0.5">
                  {shopName}
                </p>
              )}
              <p className="text-[14px] sm:text-[15px] font-medium text-[#111827] break-words">
                {productName}
              </p>
            </div>
          </div>

          {/* 금액 디테일 */}
          <div className="space-y-2.5 text-[13px] sm:text-[14px]">
            <div className="flex justify-between gap-3">
              <span className="text-[#6b7280]">상품 금액</span>
              <span className="font-medium text-[#111827] text-right">
                {originalPrice.toLocaleString()}원
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#6b7280]">할인 금액</span>
              <span className="font-medium text-[#16a34a] text-right">
                -{discountAmount.toLocaleString()}원
              </span>
            </div>

            <div className="flex justify-between gap-3 pt-2 border-t border-dashed border-[#e5e7eb] mt-2">
              <span className="text-[#4b5563] font-medium">최종 결제 금액</span>
              <span className="font-semibold text-[#111827] text-right">
                {finalPaidAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* 하단 안내 문구 */}
        <p className="mt-6 text-[12px] sm:text-[13px] text-[#9ca3af] leading-relaxed">
          주문 내역 및 결제 취소가 필요하신 경우, 서비스 내 주문/결제 내역에서
          상세 정보를 확인하시거나 고객센터로 문의해 주세요.
        </p>
      </div>

      {/* 하단 버튼 영역 (웹 스타일) */}
      <div className="mt-6 w-full max-w-xl flex gap-3">
        <button
          type="button"
          onClick={handleGoHome}
          className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#111827] hover:bg-[#f9fafb] transition-colors"
        >
          홈으로
        </button>
        <button
          type="button"
          onClick={handleGoOrders}
          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#111827] text-[14px] font-semibold text-white shadow-[0_10px_25px_rgba(15,23,42,0.25)] hover:bg-[#020617] transition-colors"
        >
          결제 계속하기
        </button>
      </div>
    </div>
  );
};

export default WebView;
