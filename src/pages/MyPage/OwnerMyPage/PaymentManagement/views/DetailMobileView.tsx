import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import MyPageHeader from "../../../../../components/MyPageHeader";
import api from "../../../../../lib/api/axios";

type ApiPaymentStatus = "DONE" | "CANCELED" | "CANCEL_REQUESTED" | "FAILED";

interface PaymentDetailResponse {
  orderCode: string;
  shopName: string;
  productName: string;
  thumbnailUrl: string | null;
  originalPrice: number;
  discountAmount: number;
  totalPrice: number;
  paidAmount: number;
  status: ApiPaymentStatus;
  approvedAt: string; // ISO
  canceledAt: string | null;
  cancelReason: string | null;
  receiptUrl: string | null;
  paymentMethod: string;
  pgProvider: string;
}

/** 금액 포맷터: 123456 -> "123,456원" */
function formatAmount(amount?: number): string {
  if (amount == null) return "0원";
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** 날짜 포맷터: ISO -> "2025.10.14" */
function formatDateLabel(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}.${month}.${date}`;
}

/** 상태 한글 라벨 */
function getStatusLabel(status?: ApiPaymentStatus): string {
  if (!status) return "예약중";
  switch (status) {
    case "DONE":
      return "예약완료";
    case "CANCELED":
      return "예약취소";
    case "CANCEL_REQUESTED":
      return "취소요청";
    case "FAILED":
      return "결제실패";
    default:
      return "예약중";
  }
}

export default function PaymentDetailMobileView() {
  const nav = useNavigate();
  const { paymentKey: paymentKeyFromParams } = useParams<{
    paymentKey: string;
  }>();
  const location = useLocation();

  const paymentKeyFromQuery = new URLSearchParams(location.search).get(
    "paymentKey"
  );
  const paymentKey = paymentKeyFromParams || paymentKeyFromQuery || "";

  const [payment, setPayment] = useState<PaymentDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentKey) {
      setErrorMsg("결제 키가 없습니다.");
      return;
    }

    const fetchPaymentDetail = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);

        const res = await api.get<PaymentDetailResponse>(
          `/api/v1/payments/${paymentKey}`
        );
        setPayment(res.data);
      } catch (err) {
        console.error(err);
        setErrorMsg("결제 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentDetail();
  }, [paymentKey]);

  const dateLabel = formatDateLabel(payment?.approvedAt);
  const statusLabel = getStatusLabel(payment?.status);

  const productPrice = formatAmount(payment?.originalPrice);
  const discountAmount = payment?.discountAmount ?? 0;
  const discountText =
    discountAmount > 0
      ? `-${discountAmount.toLocaleString("ko-KR")}원`
      : `${discountAmount.toLocaleString("ko-KR")}원`;
  const paidAmount = formatAmount(payment?.paidAmount);

  return (
    <div className="w-full bg-[#F5F6F8]">
      {/* 390 x 844 디바이스 프레임 */}
      <div className="mx-auto w-[390px] h-[844px] bg-[#F5F6F8] flex flex-col">
        {/* 상단 헤더 */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <MyPageHeader
            title="결제 내역 상세"
            onBack={() => nav(-1)}
            showMenu={false}
          />
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-auto pb-6">
          {/* 로딩 / 에러 처리 */}
          {isLoading && (
            <div className="mt-10 text-center text-sm text-gray-500">
              결제 정보를 불러오는 중입니다...
            </div>
          )}
          {errorMsg && !isLoading && (
            <div className="mt-10 text-center text-sm text-red-500">
              {errorMsg}
            </div>
          )}

          {!isLoading && !errorMsg && payment && (
            <>
              {/* 예약 상태 + 날짜 영역 */}
              <div className="mt-5 px-5 flex items-center justify-between">
                <span className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                  {statusLabel}
                </span>
                <span className="text-[14px] leading-[21px] tracking-[-0.2px] text-black/40">
                  {dateLabel}
                </span>
              </div>

              {/* 상품 정보 카드 */}
              <section className="mt-10 px-5">
                <div className="w-full rounded-[12px] border border-[#F3F4F5] bg-white px-4 pt-4 pb-5">
                  {/* 카드 제목 */}
                  <h2 className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124] mb-3">
                    상품정보
                  </h2>

                  {/* 내용 */}
                  <div className="flex items-center gap-4">
                    {/* 썸네일 */}
                    <div className="w-20 h-20 rounded-[4px] border border-[#F5F5F5] overflow-hidden bg-[#F9F9F9]">
                      {payment.thumbnailUrl ? (
                        <img
                          src={payment.thumbnailUrl}
                          alt={payment.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400">
                          이미지 없음
                        </div>
                      )}
                    </div>

                    {/* 텍스트 영역 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] leading-[21px] tracking-[-0.2px] text-black/40 truncate">
                        {payment.shopName}
                      </p>
                      <p className="mt-1 text-[14px] leading-[21px] tracking-[-0.2px] text-[#1E2124] line-clamp-2">
                        {payment.productName}
                      </p>
                    </div>

                    {/* 금액 */}
                    <div className="ml-2 self-end">
                      <span className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                        {productPrice}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 결제 내역 카드 */}
              <section className="mt-4 px-5">
                <div className="w-full rounded-[12px] border border-[#F3F4F5] bg-white px-4 py-4">
                  <div className="flex flex-col gap-4">
                    {/* 제목 */}
                    <h2 className="text-[16px] font-semibold leading-[26px] tracking-[-0.2px] text-[#1E2124]">
                      결제내역
                    </h2>

                    {/* 상단: 상품 금액 / 쿠폰 할인 */}
                    <div className="flex flex-col gap-3 border-b border-[#EEEEEE] pb-3">
                      {/* 상품 금액 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          상품 금액
                        </span>
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          {productPrice}
                        </span>
                      </div>

                      {/* 쿠폰 할인 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          쿠폰 할인
                        </span>
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          {discountText}
                        </span>
                      </div>
                    </div>

                    {/* 하단: 결제 수단 / 총 결제 금액 */}
                    <div className="flex flex-col gap-2">
                      {/* 결제 수단 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          {payment.pgProvider ||
                            payment.paymentMethod ||
                            "결제 수단"}
                        </span>
                        <span className="text-[12px] leading-[18px] tracking-[-0.1px] text-[#1E2124]">
                          {paidAmount}
                        </span>
                      </div>

                      {/* 총 결제 금액 */}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[14px] font-semibold leading-[21px] tracking-[-0.2px] text-[#1E2124]">
                          총 결제 금액
                        </span>
                        <span className="text-[14px] font-semibold leading-[21px] tracking-[-0.2px] text-[#1E2124]">
                          {paidAmount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
